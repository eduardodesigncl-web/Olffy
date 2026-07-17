// @ts-nocheck
import { useState, type SubmitEvent } from "react";
import { Drawer } from "../ui";
import type { AdminCollectionRowData } from "./AdminCollectionTable";
import styles from "./AdminCollectionEditDrawer.module.css";

interface AdminCollectionEditDrawerProps {
  collection: AdminCollectionRowData | null;
  onClose: () => void;
  onSave: (updated: AdminCollectionRowData) => void | Promise<void>;
  saving?: boolean;
  error?: string | null;
}

// Edición conectada a Shopify Admin; el contenedor decide cómo persistir y
// reporta estado de guardado/error al drawer.
export function AdminCollectionEditDrawer({
  collection,
  onClose,
  onSave,
  saving = false,
  error = null,
}: AdminCollectionEditDrawerProps) {
  return (
    <Drawer isOpen={collection !== null} onClose={onClose} side="right">
      {collection && (
        <EditForm
          key={collection.id}
          collection={collection}
          onClose={onClose}
          onSave={onSave}
          saving={saving}
          error={error}
        />
      )}
    </Drawer>
  );
}

function EditForm({
  collection,
  onClose,
  onSave,
  saving,
  error,
}: {
  collection: AdminCollectionRowData;
  onClose: () => void;
  onSave: (updated: AdminCollectionRowData) => void | Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const [nombre, setNombre] = useState(collection.nombre);
  const [handle, setHandle] = useState(collection.handle);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      ...collection,
      nombre: nombre.trim(),
      handle: handle.trim(),
      productos: collection.productos,
      estado: collection.estado,
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Editar colección</div>
          <div className={styles.title}>{collection.nombre}</div>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      <form
        className={styles.form}
        id="collection-edit-form"
        onSubmit={handleSubmit}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Handle</span>
          <input
            className={styles.input}
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
          />
        </label>
        <p className={styles.note}>
          Productos asignados: {collection.productos}. La publicación y
          asignación de productos se administra desde Shopify.
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.footer}>
        <button
          type="submit"
          form="collection-edit-form"
          className={styles.saveBtn}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar en Shopify"}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
