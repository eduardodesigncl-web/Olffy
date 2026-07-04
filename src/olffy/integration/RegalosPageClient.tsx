"use client";

// Página de Regalos construida con los componentes del frontend oficial.
// (El handoff no incluía RegalosPage; esta versión mínima reutiliza el
// header editorial + ProductGrid hasta que llegue el diseño definitivo.)
import { ProductGrid } from "../components/product";
import styles from "../pages/TiendaPage.module.css";
import type { Product } from "../types";
import { useProductModal } from "./OlffyChrome";

export function RegalosPageClient({ products }: { products: Product[] }) {
  const openProduct = useProductModal();

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>¿BUSCAS EL REGALO PERFECTO?</div>
        <h1 className={styles.title}>Kits de papelería y regalos ilustrados</h1>
        <p className={styles.subtitle}>
          Regalos únicos para amigas, estudiantes y amantes del diseño — listos
          para regalar con amor.
        </p>
        <p className={styles.count}>{products.length} productos</p>
      </div>

      <ProductGrid products={products} onProductClick={openProduct} />
    </div>
  );
}
