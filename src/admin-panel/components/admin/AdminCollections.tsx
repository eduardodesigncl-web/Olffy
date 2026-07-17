// @ts-nocheck
import { useMemo, useState } from "react";
import { EmptyState } from "../ui";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminSearchInput } from "./AdminSearchInput";
import {
  AdminCollectionTable,
  type AdminCollectionRowData,
} from "./AdminCollectionTable";
import { AdminCollectionEditDrawer } from "./AdminCollectionEditDrawer";
import { AdminPreviewModal, previewStyles } from "./AdminPreviewModal";
import { AdminShopifyRedirectModal } from "./AdminShopifyRedirectModal";
import { ADMIN_DATA } from "../../data/adminData.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminCollections.module.css";

type ShopifyCollectionProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
};

// Crear colección redirige a Shopify Admin para mantener Shopify como fuente
// comercial. Cuando se conozca el store handle, reemplazar por la URL directa.
export function AdminCollections() {
  const shopifyCollectionsUrl = `${
    adminPanelRuntime.data?.shopifyAdminUrl ?? "https://admin.shopify.com"
  }/collections`;
  const collectionRows = useMemo<AdminCollectionRowData[]>(
    () =>
      ADMIN_DATA.colecciones.map((c, idx) => ({
        id: c.id ?? `mock-${idx}`,
        nombre: c.nombre,
        handle: c.handle,
        productos: c.productos,
        estado: "Activa",
      })),
    [],
  );
  const [collections, setCollections] =
    useState<AdminCollectionRowData[]>(collectionRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCollectionRowData | null>(null);
  const [preview, setPreview] = useState<AdminCollectionRowData | null>(null);
  const [previewProducts, setPreviewProducts] = useState<
    ShopifyCollectionProduct[]
  >([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopifyOpen, setShopifyOpen] = useState(false);

  const metrics: AdminMetricCardData[] = useMemo(
    () => [
      { label: "Total colecciones", value: collections.length, tone: "morado" },
      {
        label: "Productos asignados",
        value: collections.reduce((s, c) => s + c.productos, 0),
        tone: "amarillo",
      },
      {
        label: "Colecciones activas",
        value: collections.filter((c) =>
          c.estado.toLowerCase().includes("activ"),
        ).length,
        tone: "verde",
      },
      { label: "Destacadas", value: 2, tone: "naranjo" },
    ],
    [collections],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q),
    );
  }, [collections, searchTerm]);

  const handleSave = async (updated: AdminCollectionRowData) => {
    if (updated.id.startsWith("mock-")) {
      setError("Esta colección no tiene ID de Shopify para guardar cambios.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/collections/${encodeURIComponent(updated.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.nombre,
            handle: updated.handle,
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok || payload.errors) {
        throw new Error(
          payload.errors?.[0]?.message ||
            payload.error ||
            "No se pudo actualizar la colección en Shopify.",
        );
      }

      const saved = payload.collection;
      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === updated.id
            ? {
                ...collection,
                nombre: saved?.title ?? updated.nombre,
                handle: saved?.handle ?? updated.handle,
                productos:
                  saved?.productsCount?.count ?? collection.productos ?? 0,
              }
            : collection,
        ),
      );
      setEditing(null);
      setNotice("Colección actualizada en Shopify.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la colección en Shopify.",
      );
    } finally {
      setSaving(false);
    }
  };

  const collectionAdminUrl = (collection?: AdminCollectionRowData | null) => {
    if (!collection || collection.id.startsWith("mock-")) {
      return shopifyCollectionsUrl;
    }
    const numericId = collection.id.split("/").pop();
    return numericId
      ? `${shopifyCollectionsUrl}/${numericId}`
      : shopifyCollectionsUrl;
  };

  const handleOpenShopify = (collection?: AdminCollectionRowData) => {
    window.open(
      collectionAdminUrl(collection),
      "_blank",
      "noopener,noreferrer",
    );
    setNotice("Abriendo Shopify Admin en una nueva pestaña.");
  };

  const handleViewProducts = async (collection: AdminCollectionRowData) => {
    setPreview(collection);
    setPreviewProducts([]);
    setPreviewLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/collections/${encodeURIComponent(collection.id)}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "No se pudieron cargar productos desde Shopify.",
        );
      }

      setPreviewProducts(payload.collection?.products?.nodes ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar productos desde Shopify.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>OLFFY ADMIN</div>
          <h1 className={styles.title}>Colecciones</h1>
          <p className={styles.subtitle}>
            Organiza productos por campañas, categorías y vitrinas de la tienda.
          </p>
        </div>
        <button
          type="button"
          className={styles.topBtn}
          onClick={() => setShopifyOpen(true)}
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
          Crear colección
        </button>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} metric={m} />
        ))}
      </div>

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

      {error && !editing && (
        <div className={`${styles.notice} ${styles.errorNotice}`}>
          <span className={styles.noticeText}>{error}</span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setError(null)}
            aria-label="Cerrar error"
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.searchRow}>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre o handle..."
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos colecciones con ese término."
        />
      ) : (
        <AdminCollectionTable
          collections={filtered}
          onEdit={setEditing}
          onView={handleViewProducts}
          onOpenShopify={handleOpenShopify}
        />
      )}

      <AdminCollectionEditDrawer
        collection={editing}
        onClose={() => {
          setEditing(null);
          setError(null);
        }}
        onSave={handleSave}
        saving={saving}
        error={error}
      />

      <AdminPreviewModal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        eyebrow="Productos de la colección"
        title={preview?.nombre ?? ""}
        footer={
          <button
            type="button"
            className={previewStyles.secondary}
            onClick={() => setPreview(null)}
          >
            Cerrar
          </button>
        }
      >
        {preview && (
          <>
            <div className={previewStyles.rows}>
              <div className={previewStyles.row}>
                <span className={previewStyles.rowLabel}>Handle</span>
                <span className={previewStyles.rowValue}>{preview.handle}</span>
              </div>
              <div className={previewStyles.row}>
                <span className={previewStyles.rowLabel}>Productos</span>
                <span className={previewStyles.rowValue}>
                  {preview.productos}
                </span>
              </div>
            </div>
            <ul className={previewStyles.list}>
              {previewLoading && (
                <li className={previewStyles.listItem}>
                  <span className={previewStyles.listName}>Cargando...</span>
                  <span className={previewStyles.listPrice}>Shopify</span>
                </li>
              )}
              {!previewLoading && previewProducts.length === 0 && (
                <li className={previewStyles.listItem}>
                  <span className={previewStyles.listName}>
                    Sin productos visibles
                  </span>
                  <span className={previewStyles.listPrice}>Shopify</span>
                </li>
              )}
              {!previewLoading &&
                previewProducts.map((p) => (
                  <li key={p.id} className={previewStyles.listItem}>
                    <span className={previewStyles.listName}>{p.title}</span>
                    <span className={previewStyles.listPrice}>{p.status}</span>
                  </li>
                ))}
            </ul>
            <p className={previewStyles.note}>
              Productos cargados desde Shopify Admin.
            </p>
          </>
        )}
      </AdminPreviewModal>

      <AdminShopifyRedirectModal
        isOpen={shopifyOpen}
        onClose={() => setShopifyOpen(false)}
        title="Crear colección desde Shopify"
        description="Las colecciones se crean desde Shopify para mantener productos, navegación y vitrinas sincronizadas con la tienda. En OLFFY Admin puedes revisar sus productos y editar nombre o handle cuando Shopify lo permita."
        primaryLabel="Continuar a Shopify"
        shopifyUrl={shopifyCollectionsUrl}
        onContinue={() =>
          setNotice("Abriendo Shopify Admin en una nueva pestaña.")
        }
      />
    </div>
  );
}
