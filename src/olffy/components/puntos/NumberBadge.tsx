import styles from './NumberBadge.module.css';

interface NumberBadgeProps {
  n: number;
  size?: number;
  tone?: 'amarillo' | 'morado';
}

// Número dentro de una flor OLFFY — badge de paso/regla, más de marca y
// didáctico que un simple círculo. Misma geometría de flor que IconPlaceholder.
export function NumberBadge({ n, size = 40, tone = 'amarillo' }: NumberBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${tone === 'morado' ? styles.morado : ''}`}
      style={{ width: size, height: size }}
    >
      <svg className={styles.flower} viewBox="0 0 100 100" aria-hidden="true">
        <g fill="currentColor">
          <ellipse cx="50" cy="23" rx="17" ry="24" />
          <g transform="rotate(60 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
          <g transform="rotate(120 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
          <g transform="rotate(180 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
          <g transform="rotate(240 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
          <g transform="rotate(300 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
        </g>
        <circle className={styles.flowerCenter} cx="50" cy="50" r="20" />
      </svg>
      <span className={styles.num} style={{ fontSize: Math.round(size * 0.35) }}>
        {n}
      </span>
    </span>
  );
}
