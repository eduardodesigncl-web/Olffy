// @ts-nocheck
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminRewardCard, type AdminReward } from "./AdminRewardCard";
import { AdminRewardForm } from "./AdminRewardForm";
import { AdminRewardRequests } from "./AdminRewardRequests";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminRewards.module.css";

// Sección Recompensas del panel admin. La creación persiste en Supabase; las
// mutaciones aún no implementadas permanecen deshabilitadas.

// Orquesta la vista de Recompensas. Las mutaciones no implementadas se
// muestran deshabilitadas y nunca simulan éxito.
export function AdminRewards() {
  const runtime = adminPanelRuntime.data;
  const rewards: AdminReward[] = runtime?.rewards ?? [];
  const requests = runtime?.adminData.canjesPendientes ?? [];
  const metrics: AdminMetricCardData[] = [
    {
      label: "Recompensas activas",
      value: rewards.filter((reward) => reward.estado === "Activa").length,
      tone: "morado",
    },
    {
      label: "Canjes pendientes",
      value: requests.length,
      tone: "naranjo",
    },
    {
      label: "Puntos promedio",
      value: rewards.length
        ? Math.round(
            rewards.reduce((sum, reward) => sum + reward.puntos, 0) /
              rewards.length,
          )
        : 0,
      tone: "amarillo",
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Recompensas</h1>
        <p className={styles.subtitle}>
          Gestiona beneficios canjeables, revisa solicitudes pendientes y
          prepara nuevas recompensas para el programa de puntos.
        </p>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className={styles.columns}>
        <div className={styles.rewardsPanel}>
          <h2 className={styles.panelTitle}>Recompensas disponibles</h2>
          <div className={styles.rewardsGrid}>
            {rewards.map((reward) => (
              <AdminRewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>

        <AdminRewardForm />
      </div>

      <AdminRewardRequests requests={requests} />
    </div>
  );
}
