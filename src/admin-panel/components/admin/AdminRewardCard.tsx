// @ts-nocheck
import styles from "./AdminRewardCard.module.css";

export type RewardStatus = "Activa" | "Pausada";

export interface AdminReward {
  id: number;
  nombre: string;
  puntos: number;
  estado: RewardStatus;
  descripcion: string;
}

interface AdminRewardCardProps {
  reward: AdminReward;
  onMockAction: () => void;
}

// Card de recompensa del admin. Acciones (Editar / Activar-Pausar / Ver
// canjes) son mock: disparan un aviso, no modifican datos.
export function AdminRewardCard({
  reward,
  onMockAction,
}: AdminRewardCardProps) {
  const isActive = reward.estado === "Activa";
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <div className={styles.nombre}>{reward.nombre}</div>
          <div className={styles.pts}>{reward.puntos} pts</div>
        </div>
        <span
          className={`${styles.badge} ${isActive ? styles.activa : styles.pausada}`}
        >
          <span className={styles.dot} />
          {reward.estado}
        </span>
      </div>

      <p className={styles.desc}>{reward.descripcion}</p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onMockAction}
        >
          Editar
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onMockAction}
        >
          {isActive ? "Pausar" : "Activar"}
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onMockAction}
        >
          Ver canjes
        </button>
      </div>
    </div>
  );
}
