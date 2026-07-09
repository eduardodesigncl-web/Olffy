// @ts-nocheck
import { useState, type SubmitEvent } from "react";
import { Drawer } from "../ui";
import type { AdminCollectionRowData } from "./AdminCollectionTable";
import styles from "./AdminCollectionEditDrawer.module.css";

interface AdminCollectionEditDrawerProps {
  collection: AdminCollectionRowData | null;
  onClose: () => void;
  onSave: (updated: AdminCollectionRowData) => void;
}

// Edición mock local de una colección. En producción se sincroniza con Shopify;
// aquí el guardado solo actualiza el estado local de AdminCollections.
export function AdminCollectionEditDrawer({
  collection,
  onClose,
  onSave,
}: AdminCollectionEditDrawerProps) {
  return (
    <Drawer isOpen={collection !== null} onClose={onClose} side="right">
      {collection && (
        <EditForm
          key={collection.id}
          collection={collection}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Drawer>
  );
}

function EditForm({
  collection,
  onClose,
  onSave,
}: {
  collection: AdminCollectionRowData;
  onClose: () => void;
  onSave: (updated: AdminCollectionRowData) => void;
}) {
  const [nombre, setNombre] = useState(collection.nombre);
  const [handle, setHandle] = useState(collection.handle);
  const [productos, setProductos] = useState(String(collection.productos));
  const [estado, setEstado] = useState(collection.estado);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const productosNum = Math.max(0, Number(productos) || 0);
    onSave({
      ...collection,
      nombre: nombre.trim(),
      handle: handle.trim(),
      productos: productosNum,
      estado,
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
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Productos</span>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={productos}
              onChange={(e) => setProductos(e.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Estado</span>
            <select
              className={styles.select}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="Activa">Activa</option>
              <option value="Pausada">Pausada</option>
              <option value="Borrador">Borrador</option>
            </select>
          </label>
        </div>
      </form>

      <div className={styles.footer}>
        <button
          type="submit"
          form="collection-edit-form"
          className={styles.saveBtn}
        >
          Guardar cambios
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
