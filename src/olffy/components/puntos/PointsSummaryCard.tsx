import { IconPlaceholder } from '../ui';
import styles from './PointsSummaryCard.module.css';

export interface RewardTierMini {
  puntos: number;
  label: string;
}

export interface PointsSummary {
  saldo: number;
  acumulados: number;
  usados: number;
  nextRewardPoints: number;
  nextRewardLabel: string;
  tiers: RewardTierMini[];
}

interface PointsSummaryCardProps {
  summary: PointsSummary;
}

// Detalle del saldo (tab Resumen) — tarjeta clara que complementa al
// PointsSpotlight: el saldo grande + progreso viven arriba en el Spotlight;
// aquí van el desglose (saldo/acumulados/usados) y los tiers de recompensas.
export function PointsSummaryCard({ summary }: PointsSummaryCardProps) {
  const { saldo, acumulados, usados, tiers } = summary;

  const stats = [
    { key: 'saldo', value: saldo, label: 'Saldo', highlight: true },
    { key: 'acumulados', value: acumulados, label: 'Acumulados', highlight: false },
    { key: 'usados', value: usados, label: 'Usados', highlight: false },
  ];

  return (
    <div className={styles.card}>
      <span aria-hidden="true" className={styles.flower}>
        <IconPlaceholder size={84} color="rgba(233,67,0,0.05)" />
      </span>

      <div className={styles.grid}>
        {/* Izquierda: detalle + mini métricas */}
        <div className={styles.left}>
          <h2 className={styles.head}>Detalle de tu saldo</h2>
          <div className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.key} className={`${styles.stat} ${stat.highlight ? styles.statSaldo : ''}`}>
                <div className={styles.statValue}>{stat.value.toLocaleString('es-CL')}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Derecha: recompensas compactas */}
        <div className={styles.right}>
          <div className={styles.tiersHead}>Tus recompensas</div>
          <div className={styles.tiers}>
            {tiers.map((tier) => {
              const reached = saldo >= tier.puntos;
              return (
                <div key={tier.puntos} className={`${styles.tier} ${reached ? styles.tierReached : ''}`}>
                  <div className={styles.tierPts}>{tier.puntos} pts</div>
                  <div className={styles.tierLabel}>{tier.label}</div>
                  <div className={`${styles.tierState} ${reached ? styles.tierStateReached : ''}`}>
                    {reached ? 'Disponible' : `Faltan ${tier.puntos - saldo} pts`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
