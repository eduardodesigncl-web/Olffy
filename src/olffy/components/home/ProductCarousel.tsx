import { useRef } from 'react';
import { ProductCard } from '../product';
import type { Product } from '../../types';
import styles from './ProductCarousel.module.css';

interface ProductCarouselProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

// Carrusel horizontal de productos, sin librerías: scroll con scroll-snap
// (swipe nativo en mobile) + flechas que desplazan ~el ancho visible.
export function ProductCarousel({ products, onProductClick }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => scroll(-1)}
        aria-label="Productos anteriores"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className={styles.track} ref={trackRef}>
        {products.map((product) => (
          <div key={product.id} className={styles.slide}>
            <ProductCard product={product} onClick={onProductClick} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => scroll(1)}
        aria-label="Productos siguientes"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
