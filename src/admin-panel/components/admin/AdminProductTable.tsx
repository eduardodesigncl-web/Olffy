// @ts-nocheck
import { AdminCatalogStatusBadge } from "./AdminCatalogStatusBadge";
import type { SyncState } from "./AdminProductCard";
import styles from "./AdminProductTable.module.css";

export interface AdminProductRow {
  id: number;
  nombre: string;
  handle: string;
  estado: string;
  stock: number;
  precio: string;
}

interface AdminProductTableProps {
  products: AdminProductRow[];
  syncStateOf: (id: number) => SyncState;
  onSelect: (product: AdminProductRow) => void;
}

const LOW_STOCK_THRESHOLD = 5;

const SYNC_TITLE: Record<SyncState, string> = {
  syncing: "Sincronizando…",
  synced: "Sincronizado con Shopify en modo demo",
  none: "Sin sincronizar",
};

const SYNC_CLASS: Record<SyncState, string> = {
  syncing: "syncing",
  synced: "synced",
  none: "notSynced",
};

// Vista lista del catálogo. Al seleccionar una fila se abre el drawer de detalle
// (mismo comportamiento que la galería). Solo lectura; no modifica PRODUCTS real.
export function AdminProductTable({
  products,
  syncStateOf,
  onSelect,
}: AdminProductTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Producto</th>
            <th className={styles.th}>Handle</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th}>Stock</th>
            <th className={styles.th}>Precio</th>
            <th className={styles.th}>Sincronización</th>
            <th className={styles.th} aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const low = p.stock <= LOW_STOCK_THRESHOLD;
            const sync = syncStateOf(p.id);
            return (
              <tr key={p.id} className={styles.row}>
                <td className={`${styles.td} ${styles.name}`}>{p.nombre}</td>
                <td className={`${styles.td} ${styles.handle}`}>{p.handle}</td>
                <td className={styles.td}>
                  <span className={styles.badges}>
                    <AdminCatalogStatusBadge estado={p.estado} lowStock={low} />
                  </span>
                </td>
                <td className={styles.td}>{p.stock} en stock</td>
                <td className={styles.td}>
                  <span className={styles.precio}>{p.precio}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.syncWrap}>
                    <span
                      className={`${styles.syncDot} ${styles[SYNC_CLASS[sync]]}`}
                      aria-hidden="true"
                    />
                    <span className={styles.tooltip} role="tooltip">
                      {SYNC_TITLE[sync]}
                    </span>
                  </span>
                </td>
                <td className={styles.td}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onSelect(p)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
