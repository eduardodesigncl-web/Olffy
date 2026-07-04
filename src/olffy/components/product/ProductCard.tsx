import type { MouseEvent } from "react";
import { Badge, Button, ProductImage } from "../ui";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

// Card de producto reutilizada en Home (rails/favoritos), Tienda, Novedades,
// resultados del quiz, etc. `onClick` queda listo para abrir el ProductModal
// real (vista rápida) en una fase posterior — por ahora es opcional.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <article
      className={styles.card}
      onClick={onClick ? () => onClick(product) : undefined}
    >
      <div className={styles.imageWrap}>
        <ProductImage
          src={product.image}
          alt={product.name}
          bg={product.bg}
          shape="rect"
          aspectRatio="1 / 1"
          badge={product.tag ? <Badge label={product.tag} /> : undefined}
        />
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
          {product.availableForSale ? "Agregar al carrito" : "Agotado"}
        </Button>
      </div>
    </article>
  );
}
