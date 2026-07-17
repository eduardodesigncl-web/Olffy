import type { CSSProperties } from 'react';
import { GiftIcon, type GiftIconName } from '../storefront';
import type { PublicPage } from '../layout';
import { Sparkle } from './HomeDecor';
import styles from './CategoryStickers.module.css';

interface CategoryStickersProps {
  onNavigate: (page: PublicPage) => void;
}

interface CategoryDef {
  label: string;
  icon: GiftIconName;
  bg: string;
  iconColor: string;
  page: PublicPage;
  tilt: string;
}

// Accesos de categoría estilo sticker/scrapbook (colores alternados OLFFY).
const CATEGORIES: CategoryDef[] = [
  { label: 'Cuadernos y libretas', icon: 'notebook', bg: 'var(--olffy-amarillo-suave)', iconColor: '#c8901a', page: 'tienda', tilt: '-3deg' },
  { label: 'Planners', icon: 'calendar', bg: 'var(--olffy-morado-suave)', iconColor: 'var(--olffy-morado)', page: 'tienda', tilt: '2.5deg' },
  { label: 'Stickers', icon: 'sticker', bg: 'var(--olffy-naranjo-suave)', iconColor: 'var(--olffy-naranjo)', page: 'tienda', tilt: '-2deg' },
  { label: 'Regalos', icon: 'gift', bg: '#d8ecd9', iconColor: '#2e7d32', page: 'regalos', tilt: '3deg' },
  { label: 'Novedades', icon: 'sparkles', bg: 'var(--olffy-crema)', iconColor: '#c8901a', page: 'novedades', tilt: '-2.5deg' },
];

export function CategoryStickers({ onNavigate }: CategoryStickersProps) {
  return (
    <section className={styles.section} aria-labelledby="cats-title">
      <div className={styles.head}>
        <span className={styles.eyebrow}>ENCUENTRA LO TUYO</span>
        <h2 id="cats-title" className={styles.title}>Explora el mundo OLFFY</h2>
      </div>

      <div className={styles.grid}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            type="button"
            className={styles.sticker}
            style={{ background: cat.bg, '--tilt': cat.tilt } as CSSProperties}
            onClick={() => onNavigate(cat.page)}
          >
            <span className={styles.iconChip} style={{ color: cat.iconColor }}>
              <GiftIcon name={cat.icon} size={30} color={cat.iconColor} />
            </span>
            <span className={styles.label}>{cat.label}</span>
            <Sparkle className={styles.stickerSparkle} color={cat.iconColor} size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}
