// @ts-nocheck
import { AdminCatalogStatusBadge } from "./AdminCatalogStatusBadge";
import styles from "./AdminCollectionTable.module.css";

export interface AdminCollectionRowData {
  id: number;
  nombre: string;
  handle: string;
  productos: number;
  estado: string;
}

interface AdminCollectionTableProps {
  collections: AdminCollectionRowData[];
  onEdit: (collection: AdminCollectionRowData) => void;
  onView: (collection: AdminCollectionRowData) => void;
  onToggleStatus: (collection: AdminCollectionRowData) => void;
}

// Tabla de colecciones del admin. Las acciones operan sobre el estado local de
// AdminCollections (editar/ver productos/publicar-pausar); no tocan ADMIN_DATA.
export function AdminCollectionTable({
  collections,
  onEdit,
  onView,
  onToggleStatus,
}: AdminCollectionTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Colección</th>
            <th className={styles.th}>Handle</th>
            <th className={styles.th}>Productos</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th} aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {collections.map((c) => {
            const isActive = c.estado.toLowerCase().includes("activ");
            return (
              <tr key={c.id} className={styles.row}>
                <td className={`${styles.td} ${styles.name}`}>{c.nombre}</td>
                <td className={`${styles.td} ${styles.handle}`}>{c.handle}</td>
                <td className={styles.td}>
                  <span className={styles.count}>{c.productos}</span>
                </td>
                <td className={styles.td}>
                  <AdminCatalogStatusBadge estado={c.estado} />
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onEdit(c)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onView(c)}
                    >
                      Ver productos
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onToggleStatus(c)}
                    >
                      {isActive ? "Pausar" : "Publicar"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
