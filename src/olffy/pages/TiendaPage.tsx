import { useMemo, useState } from 'react';
import { SearchBar, CategoryChips } from '../components/storefront';
import { ProductGrid, ProductCard } from '../components/product';
import { Button, EmptyState } from '../components/ui';
import { Flower, Sparkle, Squiggle } from '../components/home/HomeDecor';
import type { Category, Product } from '../types';
import styles from './TiendaPage.module.css';

interface TiendaPageProps {
  products: Product[]; // catálogo real (Shopify)
  categories: Category[]; // 'Todos' + categorías presentes en el catálogo
  onProductClick: (product: Product) => void;
  initialCategory?: Category; // filtro inicial (?categoria= / rutas legacy)
  initialQuery?: string; // búsqueda inicial (?q= de /search legacy)
}

// Página de catálogo — bloque superior compacto (header + búsqueda + filtros),
// destacados, franja editorial y grilla. El click en una card abre la página de
// detalle (/tienda/<handle>) vía onProductClick.
export function TiendaPage({
  products,
  categories,
  onProductClick,
  initialCategory,
  initialQuery,
}: TiendaPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? '');
  const [activeCategory, setActiveCategory] = useState<Category>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : 'Todos',
  );

  // Destacados de la semana: productos con etiqueta (Nuevo/Favorito/Especial)
  // y con stock primero, completando a 4 con el resto disponible.
  const featured = useMemo(() => {
    const available = products.filter((p) => p.availableForSale);
    const tagged = available.filter((p) => p.tag !== '' && p.tag !== 'Agotado');
    const rest = available.filter((p) => p.tag === '');
    return [...tagged, ...rest].slice(0, 4);
  }, [products]);
  const restProducts = useMemo(() => {
    const featuredIds = new Set(featured.map((p) => p.id));
    return products.filter((p) => !featuredIds.has(p.id));
  }, [products, featured]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'Todos' || product.cat === activeCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.cat.toLowerCase().includes(query) ||
        product.desc.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, activeCategory]);

  const hasFilters = searchQuery.trim() !== '' || activeCategory !== 'Todos';

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory('Todos');
  };

  return (
    <div className={styles.page}>
      {/* Bloque superior compacto: header + búsqueda + filtros en una superficie. */}
      <section className={styles.top}>
        <Flower className={`${styles.deco} ${styles.decoFlower}`} color="var(--olffy-naranjo)" size={64} />
        <Sparkle className={`${styles.deco} ${styles.decoSparkleA}`} color="var(--olffy-amarillo)" size={22} />
        <Sparkle className={`${styles.deco} ${styles.decoSparkleB}`} color="var(--olffy-morado)" size={15} />

        <div className={styles.topInner}>
          <span className={styles.eyebrow}>TIENDA OLFFY</span>
          <h1 className={styles.title}>Papelería ilustrada para crear, organizar y regalar</h1>
          <p className={styles.subtitle}>
            Cuadernos, planners, stickers y papelería ilustrada, todo diseñado con cariño en Viña del
            Mar.
          </p>

          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar cuadernos, planners, stickers..."
              />
            </div>
            <span className={styles.count}>{filteredProducts.length} productos</span>
          </div>

          <div className={styles.chipsWrap}>
            <CategoryChips categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
          </div>
        </div>
      </section>

      {hasFilters ? (
        // Modo búsqueda/filtro: grilla fija y uniforme (no estira las cards
        // cuando hay pocos resultados). Misma proporción en toda categoría.
        <div className={styles.gridScene}>
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              description="Prueba con otra búsqueda o categoría"
              action={
                <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <div className={styles.filteredGrid}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onClick={onProductClick} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Destacados de la semana */}
          <section className={styles.featured}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>ESTA SEMANA</span>
              <h2 className={styles.sectionTitle}>Destacados de la semana</h2>
            </div>
            <div className={styles.featuredGrid}>
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} onClick={onProductClick} />
              ))}
            </div>
          </section>

          {/* Franja editorial intermedia */}
          <div className={styles.band}>
            <Squiggle className={styles.bandSquiggle} color="var(--olffy-naranjo)" size={120} />
            <p className={styles.bandText}>Cuadernos, planners y stickers para acompañar tu rutina con cariño.</p>
          </div>

          {/* Grilla principal */}
          <section className={styles.gridScene}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>EL CATÁLOGO</span>
              <h2 className={styles.sectionTitle}>Explora todo</h2>
            </div>
            <ProductGrid products={restProducts} onProductClick={onProductClick} />
          </section>
        </>
      )}
    </div>
  );
}
