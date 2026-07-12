// @ts-nocheck
import { Drawer } from "../ui";
import { AdminCatalogStatusBadge } from "./AdminCatalogStatusBadge";
import type { AdminProductRow } from "./AdminProductTable";
import type { SyncState } from "./AdminProductCard";
import styles from "./AdminProductDetailDrawer.module.css";

export interface ProductDetailMeta {
  cat?: string;
  bg?: string;
  // Preparado para imagen real de Shopify cuando exista (product.image / imageUrl).
  image?: string;
  desc?: string;
  specs?: { l: string; v: string }[];
}

interface AdminProductDetailDrawerProps {
  product: AdminProductRow | null;
  meta?: ProductDetailMeta;
  syncState: SyncState;
  onClose: () => void;
  onEdit: (product: AdminProductRow) => void;
  onSync: (product: AdminProductRow) => void;
  onView: (product: AdminProductRow) => void;
  onOpenShopify: () => void;
}

const LOW_STOCK_THRESHOLD = 5;

const SYNC_LABEL: Record<SyncState, string> = {
  syncing: "Sincronizando…",
  synced: "Actualizado desde Shopify",
  none: "Sin sincronizar",
};

// Detalle de producto en drawer lateral derecho (mock/local). Reúne info +
// acciones; no modifica PRODUCTS real.
export function AdminProductDetailDrawer({
  product,
  meta,
  syncState,
  onClose,
  onEdit,
  onSync,
  onView,
  onOpenShopify,
}: AdminProductDetailDrawerProps) {
  return (
    <Drawer
      isOpen={product !== null}
      onClose={onClose}
      side="right"
      panelClassName={styles.panel}
    >
      {product && (
        <div className={styles.detail}>
          {/* Thumbnail preparado para imagen real de Shopify cuando exista. */}
          <div
            className={styles.media}
            style={
              meta?.image
                ? undefined
                : { background: meta?.bg || "var(--olffy-crema)" }
            }
          >
            {meta?.image ? (
              <img
                className={styles.mediaImg}
                src={meta.image}
                alt={product.nombre}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.mediaInitial} aria-hidden="true">
                {product.nombre.charAt(0).toUpperCase()}
              </span>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              ✕
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.head}>
              <h3 className={styles.name}>{product.nombre}</h3>
              <div className={styles.handle}>{product.handle}</div>
              <div className={styles.badges}>
                <AdminCatalogStatusBadge
                  estado={product.estado}
                  lowStock={product.stock <= LOW_STOCK_THRESHOLD}
                />
              </div>
            </div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Precio</span>
                <span className={styles.rowValue}>{product.precio}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Stock</span>
                <span className={styles.rowValue}>
                  {product.stock} en stock
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Categoría</span>
                <span className={styles.rowValue}>{meta?.cat || "—"}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Sincronización</span>
                <span className={styles.rowValue}>{SYNC_LABEL[syncState]}</span>
              </div>
            </div>

            {meta?.desc && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Descripción</div>
                <p className={styles.desc}>{meta.desc}</p>
              </div>
            )}

            {meta?.specs && meta.specs.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Especificaciones</div>
                <div className={styles.specs}>
                  {meta.specs.map((s) => (
                    <div key={s.l} className={styles.spec}>
                      <span className={styles.specLabel}>{s.l}</span>
                      <span className={styles.specValue}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <p className={styles.shopifyNote}>
              Catálogo administrado desde Shopify. Los cambios oficiales se
              realizan en Shopify y luego se reflejan aquí al sincronizar.
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onEdit(product)}
            >
              Editar en Shopify
            </button>
            <div className={styles.footerGrid}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onSync(product)}
                disabled={syncState === "syncing"}
              >
                {syncState === "syncing"
                  ? "Recargando..."
                  : "Recargar desde Shopify"}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onView(product)}
              >
                Ver en tienda
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled
                title="No disponible en esta versión"
              >
                Destacado no disponible
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onOpenShopify}
              >
                Abrir en Shopify
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
