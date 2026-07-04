import { CollectionCard, CountdownTimer } from "../components/storefront";
import { ProductGrid } from "../components/product";
import type { Product } from "../types";
import styles from "./NovedadesPage.module.css";

export interface NovedadesCollection {
  title: string;
  description: string;
  bg: string;
  path: string;
}

interface NovedadesPageProps {
  newProducts: Product[]; // productos con tag "Nuevo" (o los más recientes)
  collections: NovedadesCollection[]; // colecciones reales de Shopify
  onProductClick: (product: Product) => void;
  onCollectionClick: (path: string) => void;
}

// Countdown hacia un "próximo lanzamiento" — 7 días desde que se carga
// la página (constante de módulo, no se recalcula en cada render).
const LAUNCH_TARGET = Date.now() + 7 * 24 * 60 * 60 * 1000;

// Página de Novedades — colecciones destacadas (Shopify), countdown de
// lanzamiento y grid de productos nuevos, reutilizando ProductGrid/
// ProductModal ya construidos.
export function NovedadesPage({
  newProducts,
  collections,
  onProductClick,
  onCollectionClick,
}: NovedadesPageProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>NOVEDADES</div>
        <h1 className={styles.title}>
          Nuevas colecciones y productos recién llegados
        </h1>
        <p className={styles.subtitle}>
          Descubre lo último de OLFFY: colecciones limitadas, kits de regalo y
          los productos que acaban de llegar a la tienda.
        </p>
      </div>

      {collections.length > 0 && (
        <div className={styles.collectionsGrid}>
          {collections.map((collection) => (
            <CollectionCard
              key={collection.title}
              title={collection.title}
              description={collection.description}
              bg={collection.bg}
              onClick={() => onCollectionClick(collection.path)}
            />
          ))}
        </div>
      )}

      <div className={styles.countdownSection}>
        <CountdownTimer
          eyebrow="PRÓXIMO LANZAMIENTO"
          title="Nueva colección en camino ✨"
          targetDate={LAUNCH_TARGET}
        />
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Nuevos en tienda</h2>
        </div>
        <ProductGrid products={newProducts} onProductClick={onProductClick} />
      </section>
    </div>
  );
}
