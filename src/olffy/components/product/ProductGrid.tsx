import { ProductCard } from "./ProductCard";
import type { Product } from "../../types";
import styles from "./ProductGrid.module.css";

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  // `duo` fuerza 2 columnas en móvil y desktop (usado en Novedades/Regalos para
  // mostrar solo 4 recomendaciones). Por defecto usa la grilla responsiva.
  variant?: "default" | "duo";
}

// Grid responsive de productos (auto-fit/minmax) — usada en Home (favoritos),
// Tienda, Novedades, resultados de quiz, etc.
export function ProductGrid({
  products,
  onProductClick,
  variant = "default",
}: ProductGridProps) {
  const gridClass =
    variant === "duo" ? `${styles.grid} ${styles.gridDuo}` : styles.grid;
  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={onProductClick}
        />
      ))}
    </div>
  );
}
