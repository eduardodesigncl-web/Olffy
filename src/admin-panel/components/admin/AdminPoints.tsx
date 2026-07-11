// @ts-nocheck
import { AdminPointsSummary } from "./AdminPointsSummary";
import {
  AdminPointsMovements,
  type PointMovement,
} from "./AdminPointsMovements";
import { AdminPointsAdjustment } from "./AdminPointsAdjustment";
import { AdminPointsRules } from "./AdminPointsRules";
import type { AdminMetricCardData } from "./AdminMetricCard";
import { ADMIN_DATA } from "../../data/adminData.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminPoints.module.css";

// Sección Puntos del panel admin: métricas, movimientos reales del ledger,
// ajustes manuales auditables y reglas vigentes.

// Orquesta la vista de Puntos: header + métricas + (movimientos | ajuste) + reglas.
export function AdminPoints() {
  const runtime = adminPanelRuntime.data;
  const movements: PointMovement[] = runtime?.pointMovements ?? [];
  const metrics: AdminMetricCardData[] = [
    {
      label: "Puntos en circulación",
      value: runtime?.dashboardMetrics[3]?.value ?? "0",
      tone: "morado",
    },
    {
      label: "Clientes con puntos",
      value: ADMIN_DATA.clientes.length,
      tone: "morado",
    },
    {
      label: "Canjes pendientes",
      value: ADMIN_DATA.canjesPendientes.length,
      tone: "naranjo",
    },
    {
      label: "Recompensas activas",
      value:
        runtime?.rewards.filter((reward) => reward.estado === "Activa")
          .length ?? 0,
      tone: "amarillo",
    },
    {
      label: "Ajustes del mes",
      value: movements.filter((movement) => movement.origen === "Admin").length,
      tone: "verde",
    },
    {
      label: "Reversas del mes",
      value: movements.filter((movement) => movement.estado === "Reversado")
        .length,
      tone: "naranjo",
    },
  ];
  const clientes = ADMIN_DATA.clientes;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Sistema de puntos</h1>
        <p className={styles.subtitle}>
          Revisa puntos en circulación, movimientos recientes, reglas del
          programa y acciones pendientes de fidelización.
        </p>
      </div>

      <AdminPointsSummary metrics={metrics} />

      <div className={styles.columns}>
        <AdminPointsMovements movements={movements} />
        <AdminPointsAdjustment clientes={clientes} />
      </div>

      <AdminPointsRules />
    </div>
  );
}
