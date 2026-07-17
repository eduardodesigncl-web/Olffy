import type { ReactNode } from 'react';
import { IconPlaceholder } from './IconPlaceholder';
import styles from './ProductImage.module.css';

type Shape = 'rounded' | 'rect' | 'circle' | 'pill';

interface ProductImageProps {
  src?: string;
  alt?: string;
  bg?: string;
  shape?: Shape;
  aspectRatio?: string;
  badge?: ReactNode;
}

// Reemplazo directo del <image-slot> de Cloud Design: sin src, muestra un
// bloque de color con el ícono flor OLFFY como placeholder; con src, la imagen real.
export function ProductImage({
  src,
  alt = '',
  bg = '#F2E0CC',
  shape = 'rounded',
  aspectRatio = '1 / 1',
  badge,
}: ProductImageProps) {
  return (
    <div
      className={`${styles.wrap} ${styles[shape]}`}
      style={{ background: src ? undefined : bg, aspectRatio }}
    >
      {src ? (
        <img className={styles.img} src={src} alt={alt} />
      ) : (
        <IconPlaceholder size={44} />
      )}
      {badge && <div className={styles.badgeSlot}>{badge}</div>}
    </div>
  );
}
