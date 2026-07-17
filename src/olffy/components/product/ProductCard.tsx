import type { MouseEvent } from 'react';
import { Badge, Button } from '../ui';
import { ProductCardArt } from './ProductCardArt';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

// Card de producto reutilizada en Home (rails/favoritos), Tienda, Novedades,
// resultados del quiz, etc. Dos capas de visual: portada + interior/detalle que
// aparece al hover (solo desktop). `onClick` abre la página de detalle
// (/tienda/<slug>); el botón "Agregar al carrito" no propaga el click.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <article className={styles.card} onClick={onClick ? () => onClick(product) : undefined}>
      <div className={styles.media}>
        <div className={`${styles.layer} ${styles.front}`}>
          {product.image ? (
            <img className={styles.img} src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <ProductCardArt product={product} variant="front" />
          )}
        </div>
        <div className={`${styles.layer} ${styles.hoverLayer}`} aria-hidden="true">
          {product.hoverImage ? (
            <img className={styles.img} src={product.hoverImage} alt="" loading="lazy" />
          ) : (
            <ProductCardArt product={product} variant="hover" />
          )}
        </div>
        {product.tag && (
          <div className={styles.badge}>
            <Badge label={product.tag} />
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.cat}>{product.cat}</div>
        <div className={styles.name}>{product.name}</div>
        <div className={styles.price}>{product.price}</div>
        <Button
          variant="primary"
          size="sm"
          className={styles.addBtn}
          onClick={handleAddToCart}
          disabled={!product.availableForSale}
        >
          {product.availableForSale ? 'Agregar al carrito' : 'Agotado'}
        </Button>
      </div>
    </article>
  );
}
