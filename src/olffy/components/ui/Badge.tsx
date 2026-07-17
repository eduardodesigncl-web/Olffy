import styles from './Badge.module.css';
import type { ProductTag } from '../../types';

interface BadgeProps {
  label: string;
  color?: string;
}

// Colores por tipo de tag, tal como en enrichProduct() del original.
const TAG_COLORS: Record<ProductTag, string> = {
  '': 'var(--olffy-amarillo)',
  Favorito: 'var(--olffy-morado)',
  Nuevo: 'var(--olffy-naranjo)',
  NUEVO: 'var(--olffy-naranjo)',
  Especial: 'var(--olffy-naranjo)',
  Agotado: 'var(--olffy-cafe)',
};

export function Badge({ label, color }: BadgeProps) {
  const bg = color ?? TAG_COLORS[label as ProductTag] ?? 'var(--olffy-amarillo)';
  return (
    <span className={styles.badge} style={{ background: bg }}>
      {label}
    </span>
  );
}
