import { useMemo, useState } from "react";
import { SearchBar, CategoryChips } from "../components/storefront";
import { ProductGrid } from "../components/product";
import { Button, EmptyState } from "../components/ui";
import type { Category, Product } from "../types";
import styles from "./TiendaPage.module.css";

interface TiendaPageProps {
  products: Product[]; // catálogo real (Shopify)
  categories: Category[]; // 'Todos' + categorías presentes en el catálogo
  onProductClick: (product: Product) => void;
}

// Página de catálogo — búsqueda por nombre/categoría/descripción + filtro por
// categoría (chips), reutilizando ProductGrid/ProductCard/ProductModal y
// CartContext ya construidos.
export function TiendaPage({
  products,
  categories,
  onProductClick,
}: TiendaPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("Todos");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "Todos" || product.cat === activeCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.cat.toLowerCase().includes(query) ||
        product.desc.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, activeCategory]);

  const hasFilters = searchQuery.trim() !== "" || activeCategory !== "Todos";

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("Todos");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>TIENDA OLFFY</div>
        <h1 className={styles.title}>
          Papelería ilustrada para crear, organizar y regalar
        </h1>
        <p className={styles.subtitle}>
          Cuadernos, planners, stickers y papelería ilustrada, todo diseñado con
          cariño.
        </p>
        <p className={styles.count}>{filteredProducts.length} productos</p>
      </div>

      <div className={styles.filters}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar cuadernos, planners, stickers..."
        />
        <CategoryChips
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba con otra búsqueda o categoría"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          onProductClick={onProductClick}
        />
      )}
    </div>
  );
}
