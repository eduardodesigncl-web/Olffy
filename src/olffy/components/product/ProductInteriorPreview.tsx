import { useState } from 'react';
import { GiftIcon } from '../storefront';
import type { InteriorTab, InteriorType } from '../../data/productDetails';
import type { Product } from '../../types';
import styles from './ProductInteriorPreview.module.css';

interface ProductInteriorPreviewProps {
  product: Product;
  tabs: InteriorTab[];
}

const DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE'];
const DAYS_B = ['VIE', 'SÁB', 'DOM', 'NOTAS'];

// Arte de página según el tipo de interior (mock dibujado con CSS/SVG).
// Cuando la tab tenga `src` real (spread exportado a imagen), se muestra tal cual.
function PageArt({ type, side }: { type: InteriorType; side: 'left' | 'right' }) {
  switch (type) {
    case 'semanal': {
      const days = side === 'left' ? DAYS : DAYS_B;
      return (
        <div className={styles.weekGrid}>
          {days.map((d) => (
            <div key={d} className={styles.weekBox}>
              <span className={styles.weekDay}>{d}</span>
              <span className={styles.weekLines} aria-hidden="true" />
            </div>
          ))}
        </div>
      );
    }
    case 'mensual':
      return (
        <div className={styles.monthWrap}>
          <span className={styles.monthTitle}>{side === 'left' ? 'ENERO' : 'FEBRERO'}</span>
          <div className={styles.monthGrid} aria-hidden="true">
            {Array.from({ length: 35 }, (_, i) => (
              <span key={i} className={styles.monthCell} />
            ))}
          </div>
        </div>
      );
    case 'punteado':
      return <div className={styles.dotted} aria-hidden="true" />;
    case 'rayado':
      return <div className={styles.ruled} aria-hidden="true" />;
    case 'notas':
      return (
        <div className={styles.notesWrap}>
          <span className={styles.notesTitle}>{side === 'left' ? 'Notas' : 'Ideas'}</span>
          <div className={styles.ruled} aria-hidden="true" />
        </div>
      );
    case 'papel':
      return (
        <div className={styles.paperWrap}>
          <span className={styles.paperGrain} aria-hidden="true" />
          <span className={styles.paperNote}>{side === 'left' ? 'Papel 120 g/m²' : 'Marfil, suave al tacto'}</span>
        </div>
      );
    case 'ilustracion':
      return (
        <div className={styles.illoWrap} aria-hidden="true">
          <span className={`${styles.illoBlob} ${side === 'right' ? styles.illoBlobAlt : ''}`} />
          <GiftIcon name={side === 'left' ? 'palette' : 'sparkles'} size={44} color="rgba(42,28,16,0.35)" />
        </div>
      );
    case 'stickers':
      return (
        <div className={styles.stickerSheet} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={styles.stickerDot} style={{ background: ['#FBD4C2', '#DEDDF2', '#FFE9A8'][i % 3] }} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

// Visor de interior tipo libro abierto: tabs por tipo de vista + doble página.
// Solo se renderiza si el producto tiene interior que mostrar (tabs.length > 0).
export function ProductInteriorPreview({ product, tabs }: ProductInteriorPreviewProps) {
  const [index, setIndex] = useState(0);
  if (tabs.length === 0) return null;

  const active = tabs[Math.min(index, tabs.length - 1)]!;
  const prev = () => setIndex((i) => (i - 1 + tabs.length) % tabs.length);
  const next = () => setIndex((i) => (i + 1) % tabs.length);

  return (
    <section className={styles.section} aria-label={`Interior de ${product.name}`}>
      <div className={styles.head}>
        <h2 className={styles.title}>Mira su interior</h2>
        <span className={styles.counter}>
          {index + 1} / {tabs.length}
        </span>
      </div>

      <div className={styles.viewer}>
        <button type="button" className={styles.arrow} onClick={prev} aria-label="Página anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {active.src ? (
          <img className={styles.spreadImg} src={active.src} alt={`${product.name} — ${active.label}`} />
        ) : (
          <div className={styles.book} key={active.id}>
            <div className={`${styles.page} ${styles.pageLeft}`}>
              <PageArt type={active.id} side="left" />
            </div>
            <span className={styles.spine} aria-hidden="true" />
            <div className={`${styles.page} ${styles.pageRight}`}>
              <PageArt type={active.id} side="right" />
            </div>
          </div>
        )}

        <button type="button" className={styles.arrow} onClick={next} aria-label="Página siguiente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.dots} aria-hidden="true">
          {tabs.map((tab, i) => (
            <span key={tab.id} className={`${styles.dot} ${i === index ? styles.dotActive : ''}`} />
          ))}
        </div>
        <p className={styles.caption}>
          Página {index + 1} de {tabs.length} · {active.label} — {product.name}
        </p>
      </div>
    </section>
  );
}
