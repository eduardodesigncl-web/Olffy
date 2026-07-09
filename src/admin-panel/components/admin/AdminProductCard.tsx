// @ts-nocheck
import type { AdminProductRow } from "./AdminProductTable";
import styles from "./AdminProductCard.module.css";

export type SyncState = "syncing" | "synced" | "none";

interface AdminProductCardProps {
  product: AdminProductRow;
  bg?: string;
  cat?: string;
  image?: string;
  selected: boolean;
  featured: boolean;
  syncState: SyncState;
  onSelect: () => void;
}

const LOW_STOCK_THRESHOLD = 5;

const SYNC_TITLE: Record<SyncState, string> = {
  syncing: "Sincronizando",
  synced: "Sincronizado en modo demo",
  none: "Sin sincronizar",
};

function estadoMini(estado: string): { label: string; cls: string } {
  const e = estado.toLowerCase();
  if (e === "active" || e.includes("activ"))
    return { label: "Activo", cls: styles.miniActive };
  if (e === "draft" || e.includes("borrad"))
    return { label: "Borrador", cls: styles.miniDraft };
  if (e.includes("archiv"))
    return { label: "Archivado", cls: styles.miniArchived };
  if (e.includes("pausad")) return { label: "Pausada", cls: styles.miniDraft };
  return { label: estado, cls: styles.miniArchived };
}

// Tile visual de producto: la imagen/placeholder es protagonista (~70%) y la
// info va compacta debajo. Al hacer click abre el detalle en un drawer lateral.
export function AdminProductCard({
  product,
  bg,
  cat,
  image,
  selected,
  featured,
  syncState,
  onSelect,
}: AdminProductCardProps) {
  const low = product.stock <= LOW_STOCK_THRESHOLD;
  const estado = estadoMini(product.estado);

  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {/* Thumbnail preparado para imagen real de Shopify cuando exista. */}
      <div
        className={styles.media}
        style={image ? undefined : { background: bg || "var(--olffy-crema)" }}
      >
        {image ? (
          <img className={styles.mediaImg} src={image} alt={product.nombre} />
        ) : (
          <span className={styles.mediaInitial} aria-hidden="true">
            {product.nombre.charAt(0).toUpperCase()}
          </span>
        )}
        {featured && <span className={styles.featuredTag}>Destacado</span>}
        <span className={`${styles.estadoTag} ${estado.cls}`}>
          {estado.label}
        </span>
        <span
          className={`${styles.syncDot} ${styles[syncState]}`}
          title={SYNC_TITLE[syncState]}
          aria-hidden="true"
        />
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{product.nombre}</div>
        <div className={styles.sub}>
          {cat ? `${cat} · ` : ""}
          {product.handle}
        </div>
        <div className={styles.metaRow}>
          <span className={styles.precio}>{product.precio}</span>
          <span className={`${styles.stock} ${low ? styles.stockLow : ""}`}>
            {product.stock} en stock
          </span>
        </div>
      </div>
    </button>
  );
}
