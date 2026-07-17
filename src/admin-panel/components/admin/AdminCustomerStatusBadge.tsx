// @ts-nocheck
import styles from "./AdminCustomerStatusBadge.module.css";

interface AdminCustomerStatusBadgeProps {
  estado: string;
}

// Pill de estado del cliente. Verde para activos, naranjo para inactivos,
// neutro para cualquier otro valor.
export function AdminCustomerStatusBadge({
  estado,
}: AdminCustomerStatusBadgeProps) {
  const normalized = estado.toLowerCase();
  const tone = normalized.includes("activ")
    ? styles.activo
    : normalized.includes("inactiv") || normalized.includes("sin")
      ? styles.inactivo
      : styles.neutro;

  return (
    <span className={`${styles.badge} ${tone}`}>
      <span className={styles.dot} />
      {estado}
    </span>
  );
}
