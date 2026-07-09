// @ts-nocheck
import styles from "./AdminSaleSummary.module.css";

interface AdminSaleSummaryProps {
  total: number;
  puntos: number;
  clienteNombre: string | null;
  responsableLabel: string;
  canRegister: boolean;
  onRegister: () => void;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Resumen de la venta + cálculo de puntos estimados (mock).
// Regla: $1.000 gastados = 10 puntos → Math.floor(total / 1000) * 10.
export function AdminSaleSummary({
  total,
  puntos,
  clienteNombre,
  responsableLabel,
  canRegister,
  onRegister,
}: AdminSaleSummaryProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.stepBadge}>5</span>
        <h2 className={styles.title}>Resumen de venta</h2>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>Subtotal</span>
          <span className={styles.value}>{fmt(total)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Cliente</span>
          <span className={styles.value}>{clienteNombre ?? "Sin cliente"}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Responsable</span>
          <span className={styles.value}>{responsableLabel}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Origen de pago</span>
          <span className={styles.value}>TUU (mock)</span>
        </div>
      </div>

      <div className={styles.points}>
        <div className={styles.pointsTop}>
          <span className={styles.pointsLabel}>Puntos estimados</span>
          <span className={styles.pointsValue}>
            {puntos.toLocaleString("es-CL")}
          </span>
        </div>
        <div className={styles.pointsNote}>
          {clienteNombre
            ? `Se asignarán a ${clienteNombre}`
            : "No asignados todavía (venta sin cliente)"}
        </div>
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>{fmt(total)}</span>
      </div>

      <button
        type="button"
        className={styles.registerBtn}
        onClick={onRegister}
        disabled={!canRegister}
      >
        Registrar venta física
      </button>
    </div>
  );
}
