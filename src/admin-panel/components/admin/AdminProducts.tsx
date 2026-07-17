// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../ui";
import { AdminSearchInput } from "./AdminSearchInput";
import {
  AdminProductFilterCards,
  type ProductFilter,
  type ProductFilterCardDef,
} from "./AdminProductFilterCards";
import { AdminProductFilters } from "./AdminProductFilters";
import { AdminProductCard, type SyncState } from "./AdminProductCard";
import { AdminProductDetailDrawer } from "./AdminProductDetailDrawer";
import { AdminProductTable, type AdminProductRow } from "./AdminProductTable";
import { AdminShopifyRedirectModal } from "./AdminShopifyRedirectModal";
import type { AdminNavContext } from "./adminNav";
import { PRODUCTS } from "../../data/products.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminProducts.module.css";

// Sección Productos del panel admin — workspace visual de catálogo.
// FUENTE OFICIAL: Shopify es la fuente oficial de productos, precios, stock,
// variantes y publicación. OLFFY Admin visualiza el catálogo real y la
// creación/edición oficial ocurren en Shopify.

// Agregar/editar productos redirige a Shopify Admin (fuente comercial).
// Cuando se conozca el store handle, reemplazar por la URL directa
// (ej. crear: /products/new; editar: /products/<productId>).
// Configuración del modal de redirección a Shopify según la intención.
type ShopifyIntent = { title: string; description: string };

const ADD_INTENT: ShopifyIntent = {
  title: "Agregar producto desde Shopify",
  description:
    "Los productos se crean directamente en Shopify para mantener sincronizados precios, stock, variantes, imágenes y checkout. Cuando el producto esté creado en Shopify, podrás volver a OLFFY Admin y sincronizar el catálogo para visualizarlo aquí.",
};

// "Destacados" es una marca local del panel (persistida en este navegador);
// no existe campo equivalente en Shopify todavía.
const FEATURED_STORAGE_KEY = "olffy-admin-featured-products";

function loadFeaturedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FEATURED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const LOW_STOCK = 5;
const GALLERY_BATCH_SIZE = 16;

interface AdminProductsProps {
  navContext?: AdminNavContext | null;
}

type ProductView = "galeria" | "lista";

export function AdminProducts({ navContext }: AdminProductsProps = {}) {
  const router = useRouter();
  const shopifyProductsUrl = `${
    adminPanelRuntime.data?.shopifyAdminUrl ?? "https://admin.shopify.com"
  }/products`;
  const productRows = useMemo<AdminProductRow[]>(
    () =>
      PRODUCTS.map((p) => ({
        id: p.id,
        shopifyId: p.shopifyId,
        nombre: p.name,
        handle: p.handle ?? slugify(p.name),
        estado: p.status ?? "ACTIVE",
        stock: p.stock ?? 0,
        precio: p.price,
        excludeFromPoints: p.sinPuntos === true,
      })),
    [],
  );
  const productMeta = useMemo(
    () =>
      new Map(
        PRODUCTS.map((p) => [
          p.id,
          {
            cat: p.cat,
            bg: p.bg,
            image: p.image,
            images: p.images,
            desc: p.desc,
            specs: p.specs,
          },
        ]),
      ),
    [],
  );
  const avgPrice = useMemo(
    () =>
      PRODUCTS.length
        ? `$${Math.round(PRODUCTS.reduce((s, p) => s + p.n, 0) / PRODUCTS.length).toLocaleString("es-CL")}`
        : "$0",
    [],
  );
  // Catálogo hidratado desde Shopify. Solo la elegibilidad de OLFFY Puntos se
  // edita aquí; los demás datos comerciales siguen administrándose en Shopify.
  const [products, setProducts] = useState<AdminProductRow[]>(productRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  // Modal de redirección a Shopify (agregar o editar). null = cerrado.
  const [shopifyIntent, setShopifyIntent] = useState<ShopifyIntent | null>(
    null,
  );
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [pointsUpdatingId, setPointsUpdatingId] = useState<number | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<number>>(new Set());
  const [featuredIds, setFeaturedIds] = useState<Set<number>>(loadFeaturedIds);

  useEffect(() => {
    window.localStorage.setItem(
      FEATURED_STORAGE_KEY,
      JSON.stringify([...featuredIds]),
    );
  }, [featuredIds]);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>("all");
  // Producto abierto en el drawer de detalle (null = cerrado).
  const [detailId, setDetailId] = useState<number | null>(null);
  const [view, setView] = useState<ProductView>("galeria");
  const [visibleCount, setVisibleCount] = useState(GALLERY_BATCH_SIZE);

  // El toast desaparece solo tras 7s (se reinicia si llega otro). El botón
  // cerrar del aviso permite ocultarlo manualmente antes.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Navegación con contexto (ej. desde el Dashboard): aplica filtro y/o abre el
  // detalle del producto indicado.
  useEffect(() => {
    if (!navContext) return;
    if (navContext.productFilter) setActiveFilter(navContext.productFilter);
    if (navContext.productId) setDetailId(navContext.productId);
  }, [navContext]);

  useEffect(() => {
    setVisibleCount(GALLERY_BATCH_SIZE);
  }, [searchTerm, activeFilter, view]);

  useEffect(() => {
    setPointsError(null);
  }, [detailId]);

  const cards: ProductFilterCardDef[] = useMemo(
    () => [
      {
        label: "Productos activos",
        value: products.filter((p) => p.estado === "ACTIVE").length,
        tone: "verde",
        filter: "active",
      },
      {
        label: "Stock bajo",
        value: products.filter((p) => p.stock <= LOW_STOCK).length,
        tone: "naranjo",
        filter: "lowStock",
      },
      {
        label: "Productos destacados",
        value: featuredIds.size,
        tone: "amarillo",
        filter: "featured",
      },
      // Informativas: sin filtro, no clickeables.
      { label: "Productos Shopify", value: PRODUCTS.length, tone: "morado" },
      { label: "Precio promedio", value: avgPrice, tone: "morado" },
    ],
    [products, featuredIds, avgPrice],
  );

  // Cuentas para los chips de filtro.
  const counts = useMemo<Record<ProductFilter, number>>(
    () => ({
      all: products.length,
      mock: products.length,
      active: products.filter((p) => p.estado === "ACTIVE").length,
      lowStock: products.filter((p) => p.stock <= LOW_STOCK).length,
      featured: featuredIds.size,
      draft: products.filter((p) => p.estado === "DRAFT").length,
      archived: products.filter((p) => p.estado === "ARCHIVED").length,
    }),
    [products, featuredIds],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const byFilter =
        activeFilter === "all" || activeFilter === "mock"
          ? true
          : activeFilter === "active"
            ? p.estado === "ACTIVE"
            : activeFilter === "lowStock"
              ? p.stock <= LOW_STOCK
              : activeFilter === "featured"
                ? featuredIds.has(p.id)
                : activeFilter === "draft"
                  ? p.estado === "DRAFT"
                  : activeFilter === "archived"
                    ? p.estado === "ARCHIVED"
                    : true;
      const bySearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.estado.toLowerCase().includes(q) ||
        p.precio.toLowerCase().includes(q);
      return byFilter && bySearch;
    });
  }, [products, searchTerm, activeFilter, featuredIds]);

  const detailProduct = products.find((p) => p.id === detailId) ?? null;
  const visibleProducts =
    view === "galeria" ? filtered.slice(0, visibleCount) : filtered;

  const syncStateOf = (id: number): SyncState =>
    syncingId === id ? "syncing" : syncedIds.has(id) ? "synced" : "none";

  const shopifyProductUrl = (product: AdminProductRow) => {
    const numericId = product.shopifyId?.split("/").pop();
    return numericId
      ? `${shopifyProductsUrl}/${numericId}`
      : shopifyProductsUrl;
  };

  const handleEditInShopify = (product: AdminProductRow) => {
    window.open(shopifyProductUrl(product), "_blank", "noopener,noreferrer");
    setNotice("Abriendo el producto para editarlo en Shopify.");
  };

  const handleViewInStore = (product: AdminProductRow) => {
    window.open(
      `${window.location.origin}/tienda/${encodeURIComponent(product.handle)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setNotice("Abriendo el producto en la tienda online.");
  };

  // Sincronizar = volver a pedir el catálogo real a Shopify (refresh del
  // server component que hidrata el panel).
  const handleSync = (product: AdminProductRow) => {
    if (syncingId !== null) return;
    setSyncingId(product.id);
    setNotice(null);
    router.refresh();
    window.setTimeout(() => {
      setSyncingId(null);
      setSyncedIds((prev) => new Set(prev).add(product.id));
      setNotice("Catálogo actualizado desde Shopify.");
    }, 900);
  };

  const handleToggleFeatured = (product: AdminProductRow) => {
    const wasFeatured = featuredIds.has(product.id);
    setFeaturedIds((prev) => {
      const next = new Set(prev);
      if (wasFeatured) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
    setNotice(
      wasFeatured
        ? `"${product.nombre}" quitado de destacados (marca local del panel).`
        : `"${product.nombre}" marcado como destacado (marca local del panel).`,
    );
  };

  const handleTogglePoints = async (
    product: AdminProductRow,
    excluded: boolean,
  ) => {
    if (!product.shopifyId || pointsUpdatingId !== null) return;

    setPointsUpdatingId(product.id);
    setPointsError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/admin/products/${encodeURIComponent(product.shopifyId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excludeFromPoints: excluded }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Shopify rechazó el cambio");
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, excludeFromPoints: excluded }
            : item,
        ),
      );
      setNotice(
        excluded
          ? `"${product.nombre}" ya no acumula puntos.`
          : `"${product.nombre}" vuelve a acumular puntos.`,
      );
      router.refresh();
    } catch (error) {
      setPointsError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cambio en Shopify",
      );
    } finally {
      setPointsUpdatingId(null);
    }
  };

  const handleOpenShopify = (product: AdminProductRow) => {
    window.open(shopifyProductUrl(product), "_blank", "noopener,noreferrer");
    setNotice("Abriendo el producto en Shopify Admin.");
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>OLFFY ADMIN</div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>
            Catálogo administrado desde Shopify. En OLFFY Admin visualizas y
            sincronizas los productos; la creación y edición oficial ocurren en
            Shopify.
          </p>
        </div>
        <button
          type="button"
          className={styles.topBtn}
          onClick={() => setShopifyIntent(ADD_INTENT)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar producto
        </button>
      </div>

      <AdminProductFilterCards
        cards={cards}
        activeFilter={activeFilter}
        onSelect={setActiveFilter}
      />

      {notice && (
        <div className={styles.notice}>
          <svg
            className={styles.noticeIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16.5h.01" />
          </svg>
          <span className={styles.noticeText}>{notice}</span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.searchRow}>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre, handle, estado o precio..."
        />
        <div
          className={styles.viewToggle}
          role="group"
          aria-label="Vista del catálogo"
        >
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "galeria" ? styles.viewActive : ""}`}
            onClick={() => setView("galeria")}
            aria-pressed={view === "galeria"}
          >
            Galería
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "lista" ? styles.viewActive : ""}`}
            onClick={() => setView("lista")}
            aria-pressed={view === "lista"}
          >
            Lista
          </button>
        </div>
      </div>

      <AdminProductFilters
        active={activeFilter}
        counts={counts}
        onSelect={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos productos con ese término."
        />
      ) : view === "lista" ? (
        <AdminProductTable
          products={filtered}
          syncStateOf={syncStateOf}
          onSelect={(p) => setDetailId(p.id)}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {visibleProducts.map((p) => {
              const meta = productMeta.get(p.id);
              return (
                <AdminProductCard
                  key={p.id}
                  product={p}
                  bg={meta?.bg}
                  image={meta?.image}
                  cat={meta?.cat}
                  selected={p.id === detailId}
                  featured={featuredIds.has(p.id)}
                  syncState={syncStateOf(p.id)}
                  onSelect={() => setDetailId(p.id)}
                />
              );
            })}
          </div>
          {visibleCount < filtered.length && (
            <div className={styles.loadMoreRow}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={() =>
                  setVisibleCount((count) => count + GALLERY_BATCH_SIZE)
                }
              >
                Cargar más productos ({filtered.length - visibleCount})
              </button>
            </div>
          )}
        </>
      )}

      <AdminProductDetailDrawer
        product={detailProduct}
        meta={detailProduct ? productMeta.get(detailProduct.id) : undefined}
        featured={detailProduct ? featuredIds.has(detailProduct.id) : false}
        syncState={detailProduct ? syncStateOf(detailProduct.id) : "none"}
        pointsUpdating={detailProduct?.id === pointsUpdatingId}
        pointsError={pointsError}
        onClose={() => setDetailId(null)}
        onEdit={handleEditInShopify}
        onSync={handleSync}
        onView={handleViewInStore}
        onToggleFeatured={handleToggleFeatured}
        onTogglePoints={handleTogglePoints}
        onOpenShopify={handleOpenShopify}
      />

      <AdminShopifyRedirectModal
        isOpen={shopifyIntent !== null}
        onClose={() => setShopifyIntent(null)}
        title={shopifyIntent?.title ?? ""}
        description={shopifyIntent?.description ?? ""}
        primaryLabel="Continuar a Shopify"
        shopifyUrl={shopifyProductsUrl}
        onContinue={() =>
          setNotice("Abriendo Shopify Admin en una nueva pestaña.")
        }
      />
    </div>
  );
}
