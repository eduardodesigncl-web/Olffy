import { useEffect, useMemo, useState } from "react";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminSearchInput } from "./AdminSearchInput";
import { AdminSaleDetailDrawer } from "./AdminSaleDetailDrawer";
import type { AdminNavigate, AdminNavContext } from "./adminNav";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import type { UnifiedSale, UnifiedSaleOrigin } from "../../integration/types";
import styles from "./AdminSales.module.css";

export type SalesView = "dia" | "historial";
type OriginFilter = "todos" | UnifiedSaleOrigin;
type StatusFilter = "todos" | UnifiedSale["estadoPago"];

const CHILE_TIME_ZONE = "America/Santiago";

function chileDayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function clp(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

function readInitialParams(): {
  vista: SalesView;
  origen: OriginFilter;
  q: string;
} {
  if (typeof window === "undefined") {
    return { vista: "dia", origen: "todos", q: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const vista = params.get("vista") === "historial" ? "historial" : "dia";
  const origenParam = params.get("origen");
  const origen: OriginFilter =
    origenParam === "online" || origenParam === "fisica"
      ? origenParam
      : "todos";
  return { vista, origen, q: params.get("q") ?? "" };
}

// Sección Ventas: una sola vista para ventas online y físicas, separadas por
// pestañas "Ventas del día" e "Historial de ventas" y distinguidas por origen.
// La pestaña y los filtros persisten en la URL (/admin/ventas?vista=...&origen=...).
export function AdminSales({
  navContext,
  onNavigate,
}: {
  navContext?: AdminNavContext | null;
  onNavigate?: AdminNavigate;
} = {}) {
  const [view, setView] = useState<SalesView>("dia");
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [detail, setDetail] = useState<UnifiedSale | null>(null);
  const [paramsReady, setParamsReady] = useState(false);

  // La query string se lee después del montaje para no divergir del SSR.
  useEffect(() => {
    const initial = readInitialParams();
    setView(initial.vista);
    setOriginFilter(initial.origen);
    setSearchTerm(initial.q);
    setParamsReady(true);
  }, []);

  const sales = adminPanelRuntime.data?.sales ?? [];
  const shopifyAdminUrl =
    adminPanelRuntime.data?.shopifyAdminUrl ?? "https://admin.shopify.com";

  useEffect(() => {
    if (!navContext?.saleId) return;
    const requestedSale = sales.find((sale) => sale.id === navContext.saleId);
    if (!requestedSale) return;
    setDetail(requestedSale);
    setView("historial");
  }, [navContext?.saleId, sales]);

  // Persistir pestaña y filtros en la URL para que los atajos sean compartibles.
  useEffect(() => {
    if (!paramsReady || typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/admin/ventas")) return;
    const params = new URLSearchParams();
    if (view !== "dia") params.set("vista", view);
    if (originFilter !== "todos") params.set("origen", originFilter);
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `/admin/ventas?${query}` : "/admin/ventas",
    );
  }, [paramsReady, view, originFilter, searchTerm]);

  const todayKey = chileDayKey(new Date());
  const baseList = useMemo(
    () =>
      view === "dia"
        ? sales.filter((sale) => chileDayKey(sale.fechaISO) === todayKey)
        : sales,
    [sales, view, todayKey],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return baseList.filter((sale) => {
      if (originFilter !== "todos" && sale.origen !== originFilter) {
        return false;
      }
      if (
        view === "historial" &&
        statusFilter !== "todos" &&
        sale.estadoPago !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        sale.folio.toLowerCase().includes(q) ||
        sale.cliente.toLowerCase().includes(q) ||
        sale.email.toLowerCase().includes(q) ||
        sale.metodoPago.toLowerCase().includes(q) ||
        (sale.referenciaPago ?? "").toLowerCase().includes(q)
      );
    });
  }, [baseList, originFilter, statusFilter, searchTerm, view]);

  const metrics: AdminMetricCardData[] = useMemo(() => {
    const pagadas = baseList.filter((sale) => sale.estadoPago === "Pagado");
    const total = pagadas.reduce((sum, sale) => sum + sale.totalN, 0);
    const online = pagadas.filter((sale) => sale.origen === "online").length;
    const fisicas = pagadas.filter((sale) => sale.origen === "fisica").length;
    const puntos = pagadas.reduce((sum, sale) => sum + sale.puntos, 0);
    return [
      {
        label: view === "dia" ? "Vendido hoy" : "Total del período",
        value: clp(total),
        tone: "morado",
      },
      {
        label: "Ventas pagadas",
        value: pagadas.length,
        secondary: `${online} online · ${fisicas} físicas`,
        tone: "verde",
      },
      {
        label: "Pendientes / revisión",
        value: baseList.length - pagadas.length,
        tone: "amarillo",
      },
      {
        label: "Puntos generados",
        value: `${puntos.toLocaleString("es-CL")} pts`,
        tone: "naranjo",
      },
    ];
  }, [baseList, view]);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Ventas</h1>
        <p className={styles.subtitle}>
          Ventas online y de tienda física en un solo lugar. El origen de cada
          venta se distingue por su etiqueta.
        </p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Vista de ventas">
        <button
          type="button"
          role="tab"
          aria-selected={view === "dia"}
          className={`${styles.tab} ${view === "dia" ? styles.tabActive : ""}`}
          onClick={() => setView("dia")}
        >
          Ventas del día
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "historial"}
          className={`${styles.tab} ${view === "historial" ? styles.tabActive : ""}`}
          onClick={() => setView("historial")}
        >
          Historial de ventas
        </button>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className={styles.filtersRow}>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por folio, cliente, email, pago o referencia..."
        />
        <select
          className={styles.filterSelect}
          value={originFilter}
          onChange={(event) =>
            setOriginFilter(event.target.value as OriginFilter)
          }
          aria-label="Filtrar por origen"
        >
          <option value="todos">Todos los orígenes</option>
          <option value="online">Online</option>
          <option value="fisica">Tienda física</option>
        </select>
        {view === "historial" ? (
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label="Filtrar por estado de pago"
          >
            <option value="todos">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Rechazado">Rechazado</option>
            <option value="Revisión">Revisión</option>
          </select>
        ) : null}
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Folio</th>
              <th className={styles.th}>Cliente</th>
              <th className={styles.th}>Fecha</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Pago</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Origen</th>
              <th className={styles.th}>Puntos</th>
              <th className={styles.th} aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((sale) => (
              <tr key={sale.id} className={styles.row}>
                <td className={`${styles.td} ${styles.folio}`}>{sale.folio}</td>
                <td className={styles.td}>
                  <div className={styles.cliente}>{sale.cliente}</div>
                  {sale.email ? (
                    <div className={styles.email}>{sale.email}</div>
                  ) : null}
                </td>
                <td className={`${styles.td} ${styles.muted}`}>{sale.fecha}</td>
                <td className={`${styles.td} ${styles.total}`}>{sale.total}</td>
                <td className={`${styles.td} ${styles.muted}`}>
                  {sale.metodoPago}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.payBadge} ${
                      sale.estadoPago === "Pagado"
                        ? styles.payPagado
                        : sale.estadoPago === "Rechazado"
                          ? styles.payReembolsado
                          : styles.payPendiente
                    }`}
                  >
                    {sale.estadoPago}
                  </span>
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.originBadge} ${
                      sale.origen === "fisica"
                        ? styles.originFisica
                        : styles.originOnline
                    }`}
                  >
                    {sale.origenLabel}
                  </span>
                </td>
                <td className={styles.td}>{sale.puntos} pts</td>
                <td className={styles.td}>
                  <button
                    type="button"
                    className={styles.detailBtn}
                    onClick={() => setDetail(sale)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={9}>
                  {view === "dia"
                    ? "Aún no hay ventas registradas hoy."
                    : "No hay ventas que coincidan con los filtros."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <AdminSaleDetailDrawer
        sale={detail}
        shopifyAdminUrl={shopifyAdminUrl}
        onClose={() => setDetail(null)}
        onBack={
          navContext?.returnToCustomer && onNavigate
            ? () =>
                onNavigate("clientes", {
                  customerId: navContext.returnToCustomer?.customerId,
                  customersFilter: navContext.returnToCustomer?.filter,
                  customerSearch: navContext.returnToCustomer?.search,
                  customerScrollY: navContext.returnToCustomer?.scrollY,
                })
            : undefined
        }
      />
    </div>
  );
}
