// @ts-nocheck
import styles from "./AdminMetricCard.module.css";

export type AdminMetricTone = "morado" | "naranjo" | "amarillo" | "verde";

export interface AdminMetricCardData {
  label: string;
  value: string | number;
  /** Línea secundaria destacada bajo el valor (ej. cantidad de ventas del día). */
  secondary?: string;
  footnote?: string;
  tone?: AdminMetricTone;
}

// `dashboard`: tipografía compacta del Resumen operativo.
// `default`: ~+4px, más legible, para el resto de secciones del admin.
export type AdminMetricSize = "dashboard" | "default";

interface AdminMetricCardProps {
  metric: AdminMetricCardData;
  size?: AdminMetricSize;
  // Si se pasa, la card se vuelve accionable (cursor pointer + hover sutil) sin
  // cambiar su estética. Útil para navegar/filtrar desde métricas.
  onClick?: () => void;
}

// Tarjeta de KPI del admin — acento de color por `tone`, escala por `size`.
export function AdminMetricCard({
  metric,
  size = "default",
  onClick,
}: AdminMetricCardProps) {
  const tone = metric.tone ?? "morado";
  const sizeClass =
    size === "dashboard" ? styles.sizeDashboard : styles.sizeDefault;
  const inner = (
    <>
      <div className={styles.label}>{metric.label}</div>
      <div className={styles.value}>{metric.value}</div>
      {/* Línea auxiliar unificada: `secondary` y `footnote` comparten estilo. */}
      {metric.secondary && (
        <div className={styles.helper}>{metric.secondary}</div>
      )}
      {metric.footnote && (
        <div className={styles.helper}>{metric.footnote}</div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.card} ${sizeClass} ${styles[tone]} ${styles.clickable}`}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={`${styles.card} ${sizeClass} ${styles[tone]}`}>{inner}</div>
  );
}
