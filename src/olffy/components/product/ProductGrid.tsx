import { ProductCard } from './ProductCard';
import type { Product } from '../../types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

// Grid responsive de productos (auto-fit/minmax) — usada en Home (favoritos),
// Tienda, Novedades, resultados de quiz, etc.
export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={onProductClick} />
      ))}
    </div>
  );
}
