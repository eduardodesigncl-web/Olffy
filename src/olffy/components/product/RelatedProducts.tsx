import { ProductCard } from './ProductCard';
import type { Product } from '../../types';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  product: Product;
  related: Product[];
  onProductClick: (product: Product) => void;
}

// Cierre de la página de producto: bundle sugerido ("Combínalo con") si existe
// + grilla de productos relacionados ("También te puede gustar").
export function RelatedProducts({ product, related, onProductClick }: RelatedProductsProps) {
  return (
    <div className={styles.wrap}>
      {product.bundle && (
        <section className={styles.bundle} aria-label="Combínalo con">
          <div className={styles.bundleInfo}>
            <span className={styles.bundleEyebrow}>COMBÍNALO CON</span>
            <h2 className={styles.bundleName}>{product.bundle.name}</h2>
            <p className={styles.bundleDesc}>{product.bundle.desc}</p>
          </div>
          <span className={styles.bundlePrice}>{product.bundle.price}</span>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-title">
          <h2 id="related-title" className={styles.relatedTitle}>
            También te puede gustar
          </h2>
          <div className={styles.grid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onClick={onProductClick} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
