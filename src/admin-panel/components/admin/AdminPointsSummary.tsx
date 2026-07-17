// @ts-nocheck
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import styles from "./AdminPointsSummary.module.css";

interface AdminPointsSummaryProps {
  metrics: AdminMetricCardData[];
}

// Grilla de métricas del sistema de puntos (reutiliza AdminMetricCard).
export function AdminPointsSummary({ metrics }: AdminPointsSummaryProps) {
  return (
    <div className={styles.metrics}>
      {metrics.map((m) => (
        <AdminMetricCard key={m.label} metric={m} />
      ))}
    </div>
  );
}
