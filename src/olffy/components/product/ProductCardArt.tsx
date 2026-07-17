import { GiftIcon, type GiftIconName } from '../storefront';
import type { Product } from '../../types';
import styles from './ProductCardArt.module.css';

export type ArtVariant = 'front' | 'hover';

interface ProductCardArtProps {
  product: Product;
  variant: ArtVariant;
}

// Clasificación visual por categoría (los productos mock no tienen fotos aún).
type ArtKind = 'cuaderno' | 'planner' | 'stickers' | 'calendario' | 'escritura' | 'regalo' | 'generic';

function kindOf(product: Product): ArtKind {
  const c = product.cat.toLowerCase();
  if (c.includes('cuaderno')) return 'cuaderno';
  if (c.includes('planner') || /agenda|planner|weekly/i.test(product.name)) return 'planner';
  if (c.includes('sticker')) return 'stickers';
  if (c.includes('calendario')) return 'calendario';
  if (c.includes('escritura')) return 'escritura';
  if (c.includes('regalo')) return 'regalo';
  return 'generic';
}

const COVER_ICON: Record<ArtKind, GiftIconName> = {
  cuaderno: 'notebook',
  planner: 'calendar',
  stickers: 'sticker',
  calendario: 'calendar',
  escritura: 'pen',
  regalo: 'gift',
  generic: 'palette',
};

// Composición visual de producto (mock). `front` = portada/producto; `hover` =
// interior/detalle. Cuando el producto tenga image/hoverImage reales, la card
// las usa directamente y este arte no se renderiza.
export function ProductCardArt({ product, variant }: ProductCardArtProps) {
  const kind = kindOf(product);

  if (variant === 'front') {
    return <FrontArt product={product} kind={kind} />;
  }
  return <HoverArt product={product} kind={kind} />;
}

function FrontArt({ product, kind }: { product: Product; kind: ArtKind }) {
  // Cuaderno / planner: portada vertical con lomo y etiqueta.
  if (kind === 'cuaderno' || kind === 'planner') {
    return (
      <div className={styles.scene} style={{ background: product.bg }}>
        <div className={styles.cover}>
          <span className={styles.spine} aria-hidden="true" />
          <span className={styles.coverIcon}>
            <GiftIcon name={COVER_ICON[kind]} size={30} color="var(--olffy-morado)" />
          </span>
          <span className={styles.coverLabel}>{kind === 'planner' ? 'PLANNER' : 'CUADERNO'}</span>
        </div>
      </div>
    );
  }

  // Stickers: hoja con troqueles.
  if (kind === 'stickers') {
    return (
      <div className={styles.scene} style={{ background: product.bg }}>
        <div className={styles.sheet}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={styles.sheetSticker} style={{ background: ['#FBD4C2', '#DEDDF2', '#FFE9A8'][i % 3] }} />
          ))}
        </div>
      </div>
    );
  }

  // Regalo: caja con cinta.
  if (kind === 'regalo') {
    return (
      <div className={styles.scene} style={{ background: product.bg }}>
        <div className={styles.giftBox}>
          <span className={styles.giftRibbonH} aria-hidden="true" />
          <span className={styles.giftRibbonV} aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Genérico / escritura / calendario: panel con ícono de categoría.
  return (
    <div className={styles.scene} style={{ background: product.bg }}>
      <div className={styles.chipIcon}>
        <GiftIcon name={COVER_ICON[kind]} size={38} color="var(--olffy-morado)" />
      </div>
    </div>
  );
}

function HoverArt({ product, kind }: { product: Product; kind: ArtKind }) {
  const soft = shade(product.bg);

  if (kind === 'cuaderno') {
    const dotted = /puntead|dot/i.test(product.specs.map((s) => s.v).join(' '));
    return (
      <div className={styles.scene} style={{ background: soft }}>
        <div className={dotted ? styles.dotted : styles.ruled} aria-hidden="true" />
      </div>
    );
  }

  if (kind === 'planner') {
    return (
      <div className={styles.scene} style={{ background: soft }}>
        <div className={styles.weekMini} aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={styles.weekMiniBox} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'calendario') {
    return (
      <div className={styles.scene} style={{ background: soft }}>
        <div className={styles.monthMini} aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className={styles.monthMiniCell} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'stickers') {
    return (
      <div className={styles.scene} style={{ background: soft }}>
        <div className={styles.scatter} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`${styles.scatterDot} ${styles[`scatter${i}`]}`} style={{ background: ['#FBD4C2', '#DEDDF2', '#FFE9A8', '#D8ECD9', '#FFF1CE'][i] }} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'regalo') {
    return (
      <div className={styles.scene} style={{ background: soft }}>
        <div className={styles.giftOpen} aria-hidden="true">
          <GiftIcon name="heart" size={36} color="var(--olffy-naranjo)" />
        </div>
      </div>
    );
  }

  // Escritura / genérico: trazos.
  return (
    <div className={styles.scene} style={{ background: soft }}>
      <div className={styles.strokes} aria-hidden="true">
        <span className={styles.stroke} />
        <span className={styles.stroke} />
        <span className={styles.stroke} />
      </div>
    </div>
  );
}

// Oscurece levemente el color de fondo para diferenciar el "interior".
function shade(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 'var(--olffy-crema)';
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(parseInt(m[1]!, 16) - 16);
  const g = clamp(parseInt(m[2]!, 16) - 16);
  const b = clamp(parseInt(m[3]!, 16) - 16);
  return `rgb(${r}, ${g}, ${b})`;
}
