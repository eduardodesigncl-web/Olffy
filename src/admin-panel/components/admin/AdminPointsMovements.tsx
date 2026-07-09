// @ts-nocheck
import styles from "./AdminPointsMovements.module.css";

export type MovementOrigin = "Shopify" | "TUU" | "Admin" | "Canje";
export type MovementStatus = "Aprobado" | "Pendiente" | "Reversado";

export interface PointMovement {
  id: number;
  tipo: string;
  cliente: string;
  fecha: string;
  puntos: number; // positivo suma, negativo descuenta
  origen: MovementOrigin;
  estado: MovementStatus;
}

interface AdminPointsMovementsProps {
  movements: PointMovement[];
}

const STATUS_CLASS: Record<MovementStatus, string> = {
  Aprobado: styles.aprobado,
  Pendiente: styles.pendiente,
  Reversado: styles.reversado,
};

// Lista de movimientos de puntos (solo lectura, mock). Positivos en morado,
// negativos en naranjo; con origen y estado por movimiento.
export function AdminPointsMovements({ movements }: AdminPointsMovementsProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Movimientos recientes</h2>
      <div className={styles.list}>
        {movements.map((m) => {
          const isPositive = m.puntos >= 0;
          return (
            <div key={m.id} className={styles.item}>
              <div className={styles.info}>
                <div className={styles.tipo}>{m.tipo}</div>
                <div className={styles.meta}>
                  <span>{m.cliente}</span>
                  <span>·</span>
                  <span>{m.fecha}</span>
                  <span className={styles.origen}>{m.origen}</span>
                </div>
              </div>
              <div className={styles.right}>
                <span
                  className={`${styles.pts} ${isPositive ? styles.ptsPos : styles.ptsNeg}`}
                >
                  {isPositive ? "+" : "−"}
                  {Math.abs(m.puntos).toLocaleString("es-CL")} pts
                </span>
                <span className={`${styles.estado} ${STATUS_CLASS[m.estado]}`}>
                  {m.estado}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
