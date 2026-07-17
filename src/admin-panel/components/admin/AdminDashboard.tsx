import { useState } from "react";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminActivityList, type AdminActivityItem } from "./AdminActivityList";
import { AdminOperationalStatusFloating } from "./AdminOperationalStatusFloating";
import { AdminAbandonedCarts } from "./AdminAbandonedCarts";
import { AdminRecentCustomers } from "./AdminRecentCustomers";
import { AdminActiveCustomersDetail } from "./AdminActiveCustomersDetail";
import type { AdminNavigate } from "./adminNav";
import { ADMIN_DATA } from "../../data/adminData.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminDashboard.module.css";

interface AdminDashboardProps {
  onNavigate: AdminNavigate;
  canAccessSupport?: boolean;
}

type DashView = "main" | "clientes-activos";

// Dashboard del panel admin — KPIs accionables, actividad, abandono de carrito
// y clientes recientes, alimentados con los datos hidratados del servidor.
export function AdminDashboard({
  onNavigate,
  canAccessSupport = false,
}: AdminDashboardProps) {
  const [view, setView] = useState<DashView>("main");
  const runtime = adminPanelRuntime.data;
  const metrics: AdminMetricCardData[] = [
    {
      label: "Ventas del día",
      value: String(runtime?.dashboardMetrics[0]?.value ?? "$0"),
      secondary: runtime?.dashboardMetrics[0]?.footnote,
      tone: "morado",
    },
    {
      label: "Clientes activos",
      value: ADMIN_DATA.clientes.length,
      footnote: "registrados",
      tone: "morado",
    },
    {
      label: "Puntos entregados",
      value: String(runtime?.dashboardMetrics[3]?.value ?? "0"),
      footnote: "en circulación",
      tone: "amarillo",
    },
    {
      label: "Canje automático",
      value: "Activo",
      footnote: "Shopify + puntos",
      tone: "verde",
    },
    {
      label: "Productos activos",
      value:
        runtime?.products.filter((product) => product.status === "ACTIVE")
          .length ?? 0,
      footnote: "publicados",
      tone: "verde",
    },
    {
      label: "Stock bajo",
      value:
        runtime?.products.filter((product) => (product.stock ?? 0) <= 5)
          .length ?? 0,
      footnote: "requieren reposición",
      tone: "naranjo",
    },
  ];
  const activity: AdminActivityItem[] = [
    ...(runtime?.sales.map((sale) => ({
      id: sale.id,
      tipo:
        sale.origen === "fisica"
          ? "Venta física registrada"
          : "Venta online registrada",
      texto: `${sale.folio} · ${sale.total}`,
      tiempo: sale.fecha,
      tone: "venta" as const,
      timestamp: sale.fechaISO,
    })) ?? []),
    ...(runtime?.pointMovements.map((movement) => ({
      id: String(movement.id),
      tipo: movement.tipo,
      texto: `${movement.cliente} · ${movement.puntos >= 0 ? "+" : ""}${movement.puntos} pts`,
      tiempo: movement.fecha,
      tone:
        movement.origen === "Canje" ? ("canje" as const) : ("puntos" as const),
      timestamp: movement.fechaISO,
    })) ?? []),
  ]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 5)
    .map(({ timestamp: _timestamp, ...item }) => item);

  // Acción por métrica: subvista interna o navegación a otra sección con contexto.
  const metricAction = (label: string): (() => void) | undefined => {
    switch (label) {
      case "Ventas del día":
        return () => onNavigate("ventas");
      case "Clientes activos":
        return () => setView("clientes-activos");
      case "Puntos entregados":
        return () => onNavigate("puntos", { pointsView: "historial" });
      case "Canje automático":
        return () => onNavigate("recompensas");
      case "Productos activos":
        return () => onNavigate("productos", { productFilter: "active" });
      case "Stock bajo":
        return () => onNavigate("productos", { productFilter: "lowStock" });
      default:
        return undefined;
    }
  };

  const handleActivity = (item: AdminActivityItem) => {
    switch (item.tone) {
      case "venta":
        onNavigate("ventas");
        break;
      case "puntos":
        onNavigate("puntos", { pointsView: "historial" });
        break;
      case "canje":
        onNavigate("recompensas", { rewardsFilter: "pendientes" });
        break;
      case "producto":
        onNavigate(
          "productos",
          item.refId ? { productId: item.refId } : { productFilter: "active" },
        );
        break;
    }
  };

  if (view === "clientes-activos") {
    return <AdminActiveCustomersDetail onBack={() => setView("main")} />;
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Resumen operativo</h1>
      </div>

      <div className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <AdminMetricCard
            key={metric.label}
            metric={metric}
            size="dashboard"
            onClick={metricAction(metric.label)}
          />
        ))}
      </div>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Actividad reciente</h2>
          <AdminActivityList items={activity} onSelect={handleActivity} />
        </div>

        <AdminAbandonedCarts />
      </div>

      <div className={styles.fullWidth}>
        <AdminRecentCustomers />
      </div>

      <AdminOperationalStatusFloating
        onSupport={canAccessSupport ? () => onNavigate("soporte") : undefined}
      />
    </div>
  );
}
