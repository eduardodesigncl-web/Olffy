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
  featured: boolean;
  syncState: SyncState;
  pointsUpdating: boolean;
  pointsError: string | null;
  onClose: () => void;
  onEdit: (product: AdminProductRow) => void;
  onSync: (product: AdminProductRow) => void;
  onView: (product: AdminProductRow) => void;
  onToggleFeatured: (product: AdminProductRow) => void;
  onTogglePoints: (product: AdminProductRow, excluded: boolean) => void;
  onOpenShopify: (product: AdminProductRow) => void;
}

const LOW_STOCK_THRESHOLD = 5;

const SYNC_LABEL: Record<SyncState, string> = {
  syncing: "Sincronizando…",
  synced: "Actualizado desde Shopify",
  none: "Sin sincronizar",
};

// Detalle de producto en drawer lateral derecho. Los datos comerciales se
// administran en Shopify; el switch de OLFFY Puntos guarda su metafield real.
export function AdminProductDetailDrawer({
  product,
  meta,
  featured,
  syncState,
  pointsUpdating,
  pointsError,
  onClose,
  onEdit,
  onSync,
  onView,
  onToggleFeatured,
  onTogglePoints,
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
            {featured && <span className={styles.featuredTag}>Destacado</span>}
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
              <div className={styles.row}>
                <span className={styles.rowLabel}>Destacado</span>
                <span className={styles.rowValue}>
                  {featured ? "Sí" : "No"}
                </span>
              </div>
            </div>

            <div className={styles.loyaltyControl}>
              <div className={styles.loyaltyHeader}>
                <div>
                  <div className={styles.loyaltyTitle}>OLFFY Puntos</div>
                  <div className={styles.loyaltyCopy}>
                    Controla si este producto participa en la acumulación de
                    puntos.
                  </div>
                </div>
                <span
                  className={`${styles.loyaltyStatus} ${
                    product.excludeFromPoints
                      ? styles.loyaltyStatusExcluded
                      : styles.loyaltyStatusEligible
                  }`}
                >
                  {product.excludeFromPoints
                    ? "No acumula puntos"
                    : "Acumula puntos"}
                </span>
              </div>
              <div className={styles.loyaltyAction}>
                <div>
                  <div className={styles.loyaltyActionLabel}>
                    Excluir del sistema de puntos
                  </div>
                  <div className={styles.loyaltyActionHint}>
                    {pointsUpdating
                      ? "Guardando en Shopify…"
                      : "El cambio se guarda directamente en Shopify."}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={product.excludeFromPoints}
                  aria-label="Excluir este producto del sistema de puntos"
                  className={`${styles.loyaltySwitch} ${
                    product.excludeFromPoints ? styles.loyaltySwitchOn : ""
                  }`}
                  disabled={pointsUpdating || !product.shopifyId}
                  onClick={() =>
                    onTogglePoints(product, !product.excludeFromPoints)
                  }
                >
                  <span className={styles.loyaltySwitchThumb} />
                </button>
              </div>
              {pointsError && (
                <p className={styles.loyaltyError} role="alert">
                  {pointsError}
                </p>
              )}
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
                {syncState === "syncing" ? "Sincronizando..." : "Sincronizar"}
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
                onClick={() => onToggleFeatured(product)}
              >
                {featured ? "Quitar destacado" : "Marcar destacado"}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onOpenShopify(product)}
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
