// @ts-nocheck
import { useMemo, useState } from "react";
import { AdminSearchInput } from "./AdminSearchInput";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminCustomerSelector.module.css";

interface AdminCustomerSelectorProps {
  customer: AdminCliente | null;
  chosen: boolean;
  onSelect: (customer: AdminCliente) => void;
  onContinueWithout: () => void;
  onReset: () => void;
}

// Selector de cliente del POS. Busca en ADMIN_DATA.clientes (solo lectura) y
// permite continuar sin cliente. No modifica ADMIN_DATA.
export function AdminCustomerSelector({
  customer,
  chosen,
  onSelect,
  onContinueWithout,
  onReset,
}: AdminCustomerSelectorProps) {
  const [term, setTerm] = useState("");

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return ADMIN_DATA.clientes;
    return ADMIN_DATA.clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tel ?? "").toLowerCase().includes(q),
    );
  }, [term]);

  if (chosen) {
    return (
      <div className={styles.panel}>
        <div className={styles.titleRow}>
          <span className={styles.stepBadge}>1</span>
          <h2 className={styles.title}>Cliente</h2>
        </div>
        {customer ? (
          <div className={styles.selected}>
            <span className={styles.avatar}>
              {customer.nombre.charAt(0).toUpperCase()}
            </span>
            <div className={styles.selInfo}>
              <div className={styles.selName}>{customer.nombre}</div>
              <div className={styles.selMeta}>
                {customer.email} · {customer.tel || "sin teléfono"}
              </div>
              <div className={styles.selPts}>
                {customer.puntos.toLocaleString("es-CL")} pts actuales
              </div>
            </div>
            <button
              type="button"
              className={styles.changeBtn}
              onClick={onReset}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className={styles.sinCliente}>
            <span className={styles.sinLabel}>Venta sin cliente</span>
            <button
              type="button"
              className={styles.changeBtn}
              onClick={onReset}
            >
              Asignar cliente
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.stepBadge}>1</span>
        <h2 className={styles.title}>Cliente</h2>
      </div>
      <AdminSearchInput
        value={term}
        onChange={setTerm}
        placeholder="Buscar por nombre, email o teléfono..."
      />

      {results.length === 0 ? (
        <div className={styles.empty}>
          No encontramos clientes con ese término.
        </div>
      ) : (
        <div className={styles.results}>
          {results.map((c) => (
            <button
              key={c.idx}
              type="button"
              className={styles.resultRow}
              onClick={() => onSelect(c)}
            >
              <div className={styles.rInfo}>
                <div className={styles.rName}>{c.nombre}</div>
                <div className={styles.rMeta}>
                  {c.email} · {c.tel || "sin teléfono"}
                </div>
              </div>
              <span className={styles.rPts}>
                {c.puntos.toLocaleString("es-CL")} pts
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.withoutBtn}
        onClick={onContinueWithout}
      >
        Continuar sin cliente
      </button>
    </div>
  );
}
