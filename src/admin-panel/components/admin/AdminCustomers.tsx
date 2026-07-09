// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../ui";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminSearchInput } from "./AdminSearchInput";
import { AdminCustomerTable } from "./AdminCustomerTable";
import { AdminCustomerDrawer } from "./AdminCustomerDrawer";
import type { AdminNavContext } from "./adminNav";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminCustomers.module.css";

type CustomerFilter = "all" | "activos" | "canjes";

const FILTER_LABEL: Record<Exclude<CustomerFilter, "all">, string> = {
  activos: "Mostrando clientes activos",
  canjes: "Mostrando clientes con canjes pendientes",
};

interface AdminCustomersProps {
  navContext?: AdminNavContext | null;
}

// Sección Clientes del panel admin.
// CLIENTES MOCK: en producción debe leer desde Supabase/Shopify con permisos
// internos. Aquí no hay ajustes reales de puntos (acciones deshabilitadas).
export function AdminCustomers({ navContext }: AdminCustomersProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<AdminCliente | null>(null);
  const [filter, setFilter] = useState<CustomerFilter>("all");

  const clientes = ADMIN_DATA.clientes;

  // Navegación con contexto (ej. desde el Dashboard).
  useEffect(() => {
    if (navContext?.customersFilter) setFilter(navContext.customersFilter);
  }, [navContext]);

  // Clientes con canjes pendientes (match por nombre en mock).
  const canjeNames = useMemo(
    () => new Set(ADMIN_DATA.canjesPendientes.map((k) => k.cliente)),
    [],
  );

  const metrics: AdminMetricCardData[] = useMemo(() => {
    const total = clientes.length;
    const activos = clientes.filter((c) =>
      c.estado.toLowerCase().includes("activ"),
    ).length;
    const promedio =
      total > 0
        ? Math.round(clientes.reduce((s, c) => s + c.puntos, 0) / total)
        : 0;
    return [
      { label: "Total clientes", value: total, tone: "morado" },
      { label: "Clientes activos", value: activos, tone: "verde" },
      {
        label: "Puntos promedio",
        value: promedio.toLocaleString("es-CL"),
        tone: "amarillo",
      },
      {
        label: "Canjes pendientes",
        value: ADMIN_DATA.canjesPendientes.length,
        tone: "naranjo",
      },
    ];
  }, [clientes]);

  // Card → filtro (solo activas). El resto de métricas no filtran.
  const metricOnClick = (label: string): (() => void) | undefined => {
    if (label === "Clientes activos") return () => setFilter("activos");
    if (label === "Canjes pendientes") return () => setFilter("canjes");
    return undefined;
  };

  const filtered = useMemo(() => {
    let list = clientes;
    if (filter === "activos")
      list = list.filter((c) => c.estado.toLowerCase().includes("activ"));
    else if (filter === "canjes")
      list = list.filter((c) => canjeNames.has(c.nombre));
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tel ?? "").toLowerCase().includes(q),
    );
  }, [clientes, searchTerm, filter, canjeNames]);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>OLFFY ADMIN</div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>
            Busca clientas, revisa su saldo de puntos y consulta su historial de
            movimientos.
          </p>
        </div>
        <div className={styles.createWrap}>
          <button
            type="button"
            className={styles.createBtn}
            disabled
            title="Disponible en próxima fase"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Crear cliente
          </button>
          <span className={styles.createNote}>Próxima fase</span>
        </div>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard
            key={m.label}
            metric={m}
            onClick={metricOnClick(m.label)}
          />
        ))}
      </div>

      <div className={styles.searchRow}>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre, email o teléfono..."
        />
        {filter !== "all" && (
          <div className={styles.filterStatus}>
            <span>{FILTER_LABEL[filter]}</span>
            <button
              type="button"
              className={styles.clearFilter}
              onClick={() => setFilter("all")}
            >
              Limpiar filtro
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos clientes con ese término."
        />
      ) : (
        <AdminCustomerTable customers={filtered} onSelect={setSelected} />
      )}

      <AdminCustomerDrawer
        customer={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
