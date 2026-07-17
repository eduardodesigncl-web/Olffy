import type { CSSProperties } from 'react';
import styles from './OlffyPointsSummary.module.css';

type OlffyPointsSummaryProps = {
  points?: number;
  nextReward?: string;
  rewardGoal?: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-CL').format(value);
}

// Flor OLFFY plana (pétalos naranjos, centro amarillo) — ícono limpio tipo
// las flores del home.
function OlffyFlower({ className = '' }: { className?: string }) {
  return (
    <svg className={`${styles.flower} ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <g>
        <ellipse cx="60" cy="25" rx="18" ry="28" fill="#e94300" />
        <ellipse cx="60" cy="95" rx="18" ry="28" fill="#e94300" />
        <ellipse cx="25" cy="60" rx="28" ry="18" fill="#e94300" />
        <ellipse cx="95" cy="60" rx="28" ry="18" fill="#e94300" />
        <ellipse cx="35" cy="35" rx="18" ry="27" fill="#e94300" transform="rotate(-45 35 35)" />
        <ellipse cx="85" cy="35" rx="18" ry="27" fill="#e94300" transform="rotate(45 85 35)" />
        <ellipse cx="35" cy="85" rx="18" ry="27" fill="#e94300" transform="rotate(45 35 85)" />
        <ellipse cx="85" cy="85" rx="18" ry="27" fill="#e94300" transform="rotate(-45 85 85)" />
        <circle cx="60" cy="60" r="22" fill="#fab405" />
      </g>
    </svg>
  );
}

function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg className={`${styles.sparkle} ${className}`} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2L19.8 12.2L30 16L19.8 19.8L16 30L12.2 19.8L2 16L12.2 12.2L16 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Sección principal de puntos — dos cards horizontales compactas (saldo +
// próxima recompensa) al estilo del home. Persistente en todas las tabs.
export function OlffyPointsSummary({
  points = 420,
  nextReward = '$5.000 off',
  rewardGoal = 500,
}: OlffyPointsSummaryProps) {
  const missingPoints = Math.max(rewardGoal - points, 0);
  const progress = rewardGoal > 0 ? Math.min((points / rewardGoal) * 100, 100) : 100;

  return (
    <section
      className={styles.summary}
      aria-label="Resumen de puntos OLFFY"
      style={{ '--progress': `${progress}%` } as CSSProperties}
    >
      {/* Card izquierda: saldo disponible */}
      <article className={`${styles.card} ${styles.balanceCard}`}>
        <Sparkle className={styles.sparklePurple} />
        <Sparkle className={styles.sparkleYellow} />

        <div className={styles.balanceContent}>
          <OlffyFlower className={styles.mainFlower} />
          <div>
            <p className={styles.eyebrow}>Tu saldo disponible</p>
            <div className={styles.pointsRow}>
              <strong>{formatNumber(points)}</strong>
              <span>pts</span>
            </div>
          </div>
        </div>
      </article>

      {/* Card derecha: próxima recompensa */}
      <article className={`${styles.card} ${styles.rewardCard}`}>
        <Sparkle className={styles.sparkleOrangeTop} />
        <Sparkle className={styles.sparkleOrangeBottom} />

        <div className={styles.rewardTop}>
          <div className={styles.rewardLeft}>
            <p className={styles.rewardLabel}>Próxima recompensa</p>
            <h3 className={styles.rewardValue}>{nextReward}</h3>
          </div>
          <div className={styles.rewardRight}>
            <p className={styles.rewardRemaining}>Faltan {formatNumber(missingPoints)} pts</p>
            <OlffyFlower className={styles.rewardFlower} />
          </div>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} />
        </div>
      </article>
    </section>
  );
}