import type { MouseEvent } from "react";
import { Badge, Button } from "../ui";
import { ProductCardArt } from "./ProductCardArt";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

// Ancho al que se muestra la card en cada breakpoint (evita descargar imágenes
// más grandes de lo necesario desde el CDN de Shopify).
const CARD_SIZES = "(max-width: 700px) 45vw, (max-width: 1000px) 30vw, 300px";
const SRCSET_WIDTHS = [240, 320, 480, 640];

// Reemplaza (o agrega) el parámetro width= en una URL de imagen de Shopify.
function withWidth(url: string, width: number): string {
  if (/[?&]width=\d+/.test(url)) {
    return url.replace(/([?&]width=)\d+/, `$1${width}`);
  }
  return `${url}${url.includes("?") ? "&" : "?"}width=${width}`;
}

// Genera un srcset responsivo solo para imágenes servidas por el CDN de Shopify.
function shopifySrcSet(url: string): string | undefined {
  if (!url.includes("cdn.shopify.com")) return undefined;
  return SRCSET_WIDTHS.map((w) => `${withWidth(url, w)} ${w}w`).join(", ");
}

// Card de producto reutilizada en Home (rails/favoritos), Tienda, Novedades,
// resultados del quiz, etc. Dos capas de visual: portada + interior/detalle que
// aparece al hover (solo desktop). `onClick` abre la página de detalle
// (/tienda/<slug>); el botón "Agregar al carrito" no propaga el click.
export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasOptions = Boolean(product.variants?.length);

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    if (hasOptions && onClick) {
      onClick(product);
      return;
    }
    addToCart(product, 1);
  };

  return (
    <article
      className={styles.card}
      onClick={onClick ? () => onClick(product) : undefined}
    >
      <div className={styles.media}>
        <div className={`${styles.layer} ${styles.front}`}>
          {product.image ? (
            <img
              className={styles.img}
              src={
                shopifySrcSet(product.image)
                  ? withWidth(product.image, 480)
                  : product.image
              }
              srcSet={shopifySrcSet(product.image)}
              sizes={shopifySrcSet(product.image) ? CARD_SIZES : undefined}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <ProductCardArt product={product} variant="front" />
          )}
        </div>
        <div
          className={`${styles.layer} ${styles.hoverLayer}`}
          aria-hidden="true"
        >
          {product.hoverImage ? (
            <img
              className={styles.img}
              src={
                shopifySrcSet(product.hoverImage)
                  ? withWidth(product.hoverImage, 480)
                  : product.hoverImage
              }
              srcSet={shopifySrcSet(product.hoverImage)}
              sizes={shopifySrcSet(product.hoverImage) ? CARD_SIZES : undefined}
              alt=""
              loading="lazy"
            />
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
          {product.availableForSale
            ? hasOptions
              ? "Elegir opciones"
              : "Agregar al carrito"
            : "Agotado"}
        </Button>
      </div>
    </article>
  );
}
