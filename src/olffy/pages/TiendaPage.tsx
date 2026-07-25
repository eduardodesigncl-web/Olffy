import { useEffect, useMemo, useState } from "react";
import { SearchBar, CategoryChips } from "../components/storefront";
import { ProductGrid, ProductCard } from "../components/product";
import { Button, EmptyState } from "../components/ui";
import { Flower, Sparkle, Squiggle } from "../components/home/HomeDecor";
import type { Category, Product } from "../types";
import styles from "./TiendaPage.module.css";

const PRODUCTS_PER_PAGE = 12;

interface TiendaPageProps {
  products: Product[]; // catálogo real (Shopify)
  categories: Category[]; // 'Todos' + categorías presentes en el catálogo
  onProductClick: (product: Product) => void;
  initialCategory?: Category; // filtro inicial (?categoria= / rutas legacy)
  initialQuery?: string; // búsqueda inicial (?q= de /search legacy)
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Páginas del catálogo">
      <button
        type="button"
        className={styles.pageNav}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      <div className={styles.pageNumbers}>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              type="button"
              className={`${styles.pageButton} ${page === currentPage ? styles.pageButtonActive : ""}`}
              aria-current={page === currentPage ? "page" : undefined}
              aria-label={`Ir a la página ${page}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
      </div>
      <button
        type="button"
        className={styles.pageNav}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </nav>
  );
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
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
  const [activeCategories, setActiveCategories] = useState<Category[]>(
    initialCategory &&
      initialCategory !== "Todos" &&
      categories.includes(initialCategory)
      ? [initialCategory]
      : [],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sincroniza los filtros con la URL (?categoria= / ?q=). Al navegar entre
  // categorías la ruta /tienda no se remonta (solo cambia el query), así que
  // useState no reinicializa: sin esto quedarían los filtros anteriores. Cada
  // cambio de parámetro reemplaza el filtro por el de la URL y limpia el resto.
  // Solo depende de los parámetros de la URL, no del estado local, para no pisar
  // los cambios manuales de filtros/búsqueda del usuario dentro de la misma vista.
  useEffect(() => {
    setActiveCategories(
      initialCategory &&
        initialCategory !== "Todos" &&
        categories.includes(initialCategory)
        ? [initialCategory]
        : [],
    );
    setSearchQuery(initialQuery ?? "");
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory, initialQuery]);

  // Destacados de la semana: productos con etiqueta (Nuevo/Favorito/Especial)
  // y con stock primero, completando a 4 con el resto disponible.
  const featured = useMemo(() => {
    const available = products.filter((p) => p.availableForSale);
    const tagged = available.filter((p) => p.tag !== "" && p.tag !== "Agotado");
    const rest = available.filter((p) => p.tag === "");
    return [...tagged, ...rest].slice(0, 4);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(product.cat);
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.cat.toLowerCase().includes(query) ||
        product.desc.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, activeCategories]);

  const hasFilters = searchQuery.trim() !== "" || activeCategories.length > 0;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * PRODUCTS_PER_PAGE,
    safeCurrentPage * PRODUCTS_PER_PAGE,
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategorySelect = (category: Category) => {
    setCurrentPage(1);
    if (category === "Todos") {
      setActiveCategories([]);
      return;
    }
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategories([]);
    setCurrentPage(1);
  };

  return (
    <div className={styles.page}>
      {/* Bloque superior compacto: header + búsqueda + filtros en una superficie. */}
      <section className={styles.top}>
        <Flower
          className={`${styles.deco} ${styles.decoFlower}`}
          color="var(--olffy-naranjo)"
          size={64}
        />
        <Sparkle
          className={`${styles.deco} ${styles.decoSparkleA}`}
          color="var(--olffy-amarillo)"
          size={22}
        />
        <Sparkle
          className={`${styles.deco} ${styles.decoSparkleB}`}
          color="var(--olffy-morado)"
          size={15}
        />

        <div className={styles.topInner}>
          <span className={styles.eyebrow}>TIENDA OLFFY</span>
          <h1 className={styles.title}>
            Papelería ilustrada para crear, organizar y regalar
          </h1>

          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar cuadernos, planners, stickers..."
              />
            </div>
          </div>

          <div className={styles.filterHeader}>
            <span className={styles.filterTitle}>Filtrar por categorías</span>
            <button
              type="button"
              className={styles.filterToggle}
              aria-expanded={filtersOpen}
              aria-controls="store-category-filters"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <span>Categorías</span>
              <span className={styles.filterToggleMeta}>
                {activeCategories.length === 0
                  ? "Ver filtros"
                  : `${activeCategories.length} ${
                      activeCategories.length === 1
                        ? "seleccionada"
                        : "seleccionadas"
                    }`}
              </span>
              <span
                className={`${styles.filterChevron} ${
                  filtersOpen ? styles.filterChevronOpen : ""
                }`}
                aria-hidden="true"
              >
                ⌄
              </span>
            </button>
            {activeCategories.length > 0 && (
              <button
                type="button"
                className={styles.clearCategories}
                onClick={() => {
                  setActiveCategories([]);
                  setCurrentPage(1);
                }}
              >
                Limpiar categorías
              </button>
            )}
          </div>

          <div
            id="store-category-filters"
            className={`${styles.chipsWrap} ${
              filtersOpen ? styles.chipsOpen : ""
            }`}
          >
            <CategoryChips
              categories={categories}
              activeCategories={activeCategories}
              onSelect={handleCategorySelect}
            />
          </div>
        </div>
      </section>

      {hasFilters ? (
        <section className={styles.gridScene}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>RESULTADOS</span>
            <h2 className={styles.sectionTitle}>
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "producto encontrado"
                : "productos encontrados"}
            </h2>
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
            <>
              <PaginationControls
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <div className={styles.filteredGrid}>
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={onProductClick}
                  />
                ))}
              </div>
              <PaginationControls
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
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
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={onProductClick}
                />
              ))}
            </div>
          </section>

          {/* Franja editorial intermedia */}
          <div className={styles.band}>
            <Squiggle
              className={styles.bandSquiggle}
              color="var(--olffy-naranjo)"
              size={120}
            />
            <p className={styles.bandText}>
              Cuadernos, planners y stickers para acompañar tu rutina con
              cariño.
            </p>
          </div>

          {/* Grilla principal */}
          <section className={styles.gridScene}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>EL CATÁLOGO</span>
              <h2 className={styles.sectionTitle}>Explora todo</h2>
            </div>
            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            <ProductGrid
              products={visibleProducts}
              onProductClick={onProductClick}
            />
            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </section>
        </>
      )}
    </div>
  );
}
