import { IconPlaceholder } from '../ui';
import styles from './PointsSpotlight.module.css';

interface PointsSpotlightProps {
  saldo: number;
  nextRewardPoints: number;
  nextRewardLabel: string;
}

// Banner persistente de puntos — vive arriba del contenido de las tabs y se
// muestra en TODAS ellas, para que el saldo grande sea siempre visible (antes
// solo se veía grande en Resumen y quedaba como chip diminuto en las demás).
export function PointsSpotlight({ saldo, nextRewardPoints, nextRewardLabel }: PointsSpotlightProps) {
  const remaining = Math.max(0, nextRewardPoints - saldo);
  const progressPct = Math.min(100, Math.round((saldo / nextRewardPoints) * 100));

  return (
    <div className={styles.spotlight}>
      <span aria-hidden="true" className={styles.blob} />
      <span aria-hidden="true" className={styles.flower}>
        <IconPlaceholder size={160} color="rgba(255,255,255,0.08)" />
      </span>

      <div className={styles.balanceCol}>
        <span className={styles.balanceFlower}>
          <IconPlaceholder size={56} color="var(--olffy-amarillo)" />
        </span>
        <div>
          <div className={styles.balanceLabel}>Tu saldo disponible</div>
          <div className={styles.balanceValue}>
            {saldo.toLocaleString('es-CL')}
            <span className={styles.balanceUnit}>pts</span>
          </div>
        </div>
      </div>

      <div className={styles.rewardCol}>
        <div className={styles.rewardHead}>
          <span className={styles.rewardLabel}>Próxima recompensa</span>
          <span className={styles.rewardRemaining}>
            {remaining === 0 ? '¡Disponible!' : `Faltan ${remaining} pts`}
          </span>
        </div>
        <div className={styles.rewardTarget}>{nextRewardLabel}</div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}
