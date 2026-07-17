import { useEffect, useMemo, useState } from 'react';
import { Badge, IconPlaceholder } from '../ui';
import { GALLERY_VIEWS, type GalleryView } from '../../data/productDetails';
import type { Product } from '../../types';
import styles from './ProductGallery.module.css';

// Con imágenes reales (Shopify), cada vista de la galería es una foto; sin
// ellas se mantienen las 4 vistas mock de marca (portada/reverso/detalle/uso).
function viewsForProduct(product: Product): GalleryView[] {
  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  if (images.length === 0) return GALLERY_VIEWS;
  return images.slice(0, 6).map((src, idx) => ({
    id: GALLERY_VIEWS[Math.min(idx, GALLERY_VIEWS.length - 1)]!.id,
    label: idx === 0 ? 'Portada' : `Vista ${idx + 1}`,
    src,
  }));
}

interface ProductGalleryProps {
  product: Product;
}

// Galería del detalle de producto: vista principal + thumbnails (portada,
// reverso, detalle, en uso). Sin fotos reales aún, cada vista se dibuja como
// composición mock de marca sobre el color del producto; cuando exista `src`
// en la vista, se muestra la imagen real sin cambiar la estructura.
function ViewArt({ view, product, large }: { view: GalleryView; product: Product; large?: boolean }) {
  if (view.src) {
    return <img className={styles.viewImg} src={view.src} alt={`${product.name} — ${view.label}`} />;
  }

  return (
    <div className={`${styles.art} ${styles[`art-${view.id}`]}`} style={{ background: product.bg }}>
      {view.id === 'portada' && <IconPlaceholder size={large ? 64 : 30} />}
      {view.id === 'reverso' && (
        <span className={styles.backLogo} aria-hidden="true">
          OLFFY®
        </span>
      )}
      {view.id === 'detalle' && <span className={styles.zoomPattern} aria-hidden="true" />}
      {view.id === 'uso' && (
        <>
          <span className={styles.usoSheet} aria-hidden="true" />
          <span className={styles.usoSheetTwo} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
export function ProductGallery({ product }: ProductGalleryProps) {
  const views = useMemo(() => viewsForProduct(product), [product]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset al cambiar de producto (navegación entre relacionados).
  useEffect(() => {
    setActiveIdx(0);
  }, [product.id]);

  const active = views[Math.min(activeIdx, views.length - 1)] ?? GALLERY_VIEWS[0]!;
  const canNavigate = views.length > 1;

  const showPrevious = () => {
    setActiveIdx((current) => (current - 1 + views.length) % views.length);
  };

  const showNext = () => {
    setActiveIdx((current) => (current + 1) % views.length);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <ViewArt view={active} product={product} large />
        {canNavigate && (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrevious}`}
              onClick={showPrevious}
              aria-label={`Ver foto anterior de ${product.name}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m14.5 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={showNext}
              aria-label={`Ver foto siguiente de ${product.name}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9.5 6 6 6-6 6" />
              </svg>
            </button>
          </>
        )}
        {product.tag && (
          <div className={styles.badgeSlot}>
            <Badge label={product.tag} />
          </div>
        )}
        <span className={styles.viewLabel}>{active.label}</span>
      </div>

      <div className={styles.thumbs} role="tablist" aria-label="Vistas del producto">
        {views.map((view, idx) => (
          <button
            key={`${view.id}-${idx}`}
            type="button"
            role="tab"
            aria-selected={activeIdx === idx}
            aria-label={`Vista ${view.label}`}
            className={`${styles.thumb} ${activeIdx === idx ? styles.thumbActive : ''}`}
            onClick={() => setActiveIdx(idx)}
          >
            <ViewArt view={view} product={product} />
          </button>
        ))}
      </div>
    </div>
  );
}
