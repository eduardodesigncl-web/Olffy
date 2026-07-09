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
import { PRODUCTS } from "../../data/products.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminCollections.module.css";

// Sección Colecciones del panel admin.
// AdminProducts/AdminCollections mock. En producción debe leer y sincronizar el
// catálogo desde Shopify con permisos internos. Aquí toda edición/acción opera
// solo sobre estado local (no modifica ADMIN_DATA).

// Crear colección redirige a Shopify Admin para mantener Shopify como fuente
// comercial. Cuando se conozca el store handle, reemplazar por la URL directa.
export function AdminCollections() {
  const shopifyCollectionsUrl = `${
    adminPanelRuntime.data?.shopifyAdminUrl ?? "https://admin.shopify.com"
  }/collections`;
  const collectionRows = useMemo<AdminCollectionRowData[]>(
    () =>
      ADMIN_DATA.colecciones.map((c, idx) => ({
        id: idx,
        nombre: c.nombre,
        handle: c.handle,
        productos: c.productos,
        estado: "Activa",
      })),
    [],
  );
  const previewProducts = useMemo(() => PRODUCTS.slice(0, 3), []);
  const [collections, setCollections] =
    useState<AdminCollectionRowData[]>(collectionRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCollectionRowData | null>(null);
  const [preview, setPreview] = useState<AdminCollectionRowData | null>(null);
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

  // Guardado mock local: no toca ADMIN_DATA real.
  const handleSave = (updated: AdminCollectionRowData) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    setEditing(null);
    setNotice("Colección actualizada en modo demo.");
  };

  const handleToggle = (collection: AdminCollectionRowData) => {
    const nextEstado = collection.estado.toLowerCase().includes("activ")
      ? "Pausada"
      : "Activa";
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collection.id ? { ...c, estado: nextEstado } : c,
      ),
    );
    setNotice("Estado de colección actualizado en modo demo.");
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
          onView={setPreview}
          onToggleStatus={handleToggle}
        />
      )}

      <AdminCollectionEditDrawer
        collection={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
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
              {previewProducts.map((p) => (
                <li key={p.id} className={previewStyles.listItem}>
                  <span className={previewStyles.listName}>{p.name}</span>
                  <span className={previewStyles.listPrice}>{p.price}</span>
                </li>
              ))}
            </ul>
            <p className={previewStyles.note}>
              Vista demo. En producción se cargará desde Shopify.
            </p>
          </>
        )}
      </AdminPreviewModal>

      <AdminShopifyRedirectModal
        isOpen={shopifyOpen}
        onClose={() => setShopifyOpen(false)}
        title="Crear colección desde Shopify"
        description="Las colecciones se administran desde Shopify para mantener productos, navegación y vitrinas sincronizadas con la tienda. Desde OLFFY Admin podrás revisarlas y editarlas en modo demo, pero la publicación oficial ocurre en Shopify."
        primaryLabel="Continuar a Shopify"
        shopifyUrl={shopifyCollectionsUrl}
        onContinue={() =>
          setNotice("Abriendo Shopify Admin en una nueva pestaña.")
        }
      />
    </div>
  );
}
