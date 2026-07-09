// @ts-nocheck
import styles from "./AdminResponsibleSelector.module.css";

export interface AdminResponsible {
  id: number;
  nombre: string;
  cargo: string;
  rut?: string;
}

interface AdminResponsibleSelectorProps {
  responsibles: AdminResponsible[];
  selectedId: number;
  onSelect: (id: number) => void;
}

// Selector de responsable de la venta (mock local). Solo permite escoger entre
// los responsables existentes; no se agregan responsables desde aquí.
export function AdminResponsibleSelector({
  responsibles,
  selectedId,
  onSelect,
}: AdminResponsibleSelectorProps) {
  const selected =
    responsibles.find((r) => r.id === selectedId) ?? responsibles[0];

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.stepBadge}>2</span>
        <h2 className={styles.title}>Responsable</h2>
      </div>
      <div className={styles.row}>
        <select
          className={styles.select}
          value={selectedId}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          {responsibles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} — {r.cargo}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className={styles.cargo}>
          Cargo: <span className={styles.cargoName}>{selected.cargo}</span>
        </div>
      )}
    </div>
  );
}
