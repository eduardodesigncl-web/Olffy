// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../ui";
import { Modal } from "../ui/Modal";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminSearchInput } from "./AdminSearchInput";
import { AdminCustomerTable } from "./AdminCustomerTable";
import { AdminCustomerDrawer } from "./AdminCustomerDrawer";
import type { AdminNavigate, AdminNavContext } from "./adminNav";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminCustomers.module.css";

type CustomerFilter = "all" | "activos" | "canjes";

const FILTER_LABEL: Record<Exclude<CustomerFilter, "all">, string> = {
  activos: "Mostrando clientes activos",
  canjes: "Mostrando clientes con canjes pendientes",
};

interface AdminCustomersProps {
  navContext?: AdminNavContext | null;
  onNavigate?: AdminNavigate;
}

// Sección Clientes del panel admin.
// CLIENTES MOCK: en producción debe leer desde Supabase/Shopify con permisos
// internos. Aquí no hay ajustes reales de puntos (acciones deshabilitadas).
export function AdminCustomers({
  navContext,
  onNavigate,
}: AdminCustomersProps = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<AdminCliente | null>(null);
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [clientes, setClientes] = useState<AdminCliente[]>(() => [
    ...ADMIN_DATA.clientes,
  ]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const createCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/loyalty/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        customer?: {
          id: number;
          email: string;
          full_name: string | null;
          status: string;
          points_balance: number;
          created_at: string;
        };
      };
      if (!response.ok || !data.customer) {
        throw new Error(data.error || "No se pudo crear el cliente");
      }
      const created: AdminCliente = {
        idx: data.customer.id,
        nombre: data.customer.full_name ?? data.customer.email,
        email: data.customer.email,
        tel: "",
        puntos: data.customer.points_balance,
        estado: data.customer.status === "active" ? "Activo" : "Bloqueado",
        createdAt: data.customer.created_at,
      };
      setClientes((current) => [
        created,
        ...current.filter((item) => item.idx !== created.idx),
      ]);
      ADMIN_DATA.clientes.splice(
        0,
        ADMIN_DATA.clientes.length,
        created,
        ...ADMIN_DATA.clientes.filter((item) => item.idx !== created.idx),
      );
      setCreateOpen(false);
      setCreateSuccess(
        `${created.nombre} fue creada en Shopify y OLFFY Puntos.`,
      );
    } catch (cause) {
      setCreateError(
        cause instanceof Error ? cause.message : "No se pudo crear el cliente",
      );
    } finally {
      setCreating(false);
    }
  };

  // Navegación con contexto (ej. desde el Dashboard).
  useEffect(() => {
    if (navContext?.customersFilter) setFilter(navContext.customersFilter);
    if (navContext?.customerSearch !== undefined) {
      setSearchTerm(navContext.customerSearch);
    }
    if (navContext?.customerId) {
      const requested = clientes.find(
        (customer) => customer.idx === navContext.customerId,
      );
      if (requested) setSelected(requested);
    }
    if (navContext?.customerScrollY !== undefined) {
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: navContext.customerScrollY }),
      );
    }
  }, [clientes, navContext]);

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
        label: "Puntos totales",
        value: clientes
          .reduce((sum, cliente) => sum + cliente.puntos, 0)
          .toLocaleString("es-CL"),
        tone: "naranjo",
      },
    ];
  }, [clientes]);

  // Card → filtro (solo activas). El resto de métricas no filtran.
  const metricOnClick = (label: string): (() => void) | undefined => {
    if (label === "Clientes activos") return () => setFilter("activos");
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
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
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
        </div>
      </div>

      {createSuccess ? (
        <div className={styles.success} role="status">
          {createSuccess}
          <button
            type="button"
            onClick={() => setCreateSuccess(null)}
            aria-label="Cerrar confirmación"
          >
            ✕
          </button>
        </div>
      ) : null}

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
          placeholder="Buscar por nombre o email..."
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
        onOpenSale={(saleId) => {
          if (!selected || !onNavigate) return;
          onNavigate("ventas", {
            saleId,
            returnToCustomer: {
              customerId: selected.idx,
              filter: filter === "all" ? undefined : filter,
              search: searchTerm,
              scrollY: window.scrollY,
            },
          });
        }}
        onOpenSupport={(conversationId, archived) => {
          if (!selected || !onNavigate) return;
          onNavigate("soporte", {
            supportConversationId: conversationId,
            supportArchived: archived,
            returnToCustomer: {
              customerId: selected.idx,
              filter: filter === "all" ? undefined : filter,
              search: searchTerm,
              scrollY: window.scrollY,
            },
          });
        }}
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        panelClassName={styles.createModal}
      >
        <form
          className={styles.createForm}
          onSubmit={(event) => void createCustomer(event)}
        >
          <div className={styles.modalEyebrow}>NUEVA CLIENTA</div>
          <h2>Crear cliente</h2>
          <p>
            Se crea en Shopify y queda inscrita en OLFFY Puntos con saldo
            inicial cero.
          </p>
          <label>
            Nombre completo
            <input name="fullName" required minLength={2} autoFocus />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          {createError ? (
            <div className={styles.formError} role="alert">
              {createError}
            </div>
          ) : null}
          <button type="submit" disabled={creating}>
            {creating ? "Creando..." : "Crear en Shopify y OLFFY"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
