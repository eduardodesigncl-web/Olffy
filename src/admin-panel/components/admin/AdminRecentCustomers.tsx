// @ts-nocheck
import { useState } from "react";
import { AdminCustomerDrawer } from "./AdminCustomerDrawer";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminRecentCustomers.module.css";

interface RecentCustomer {
  cliente: AdminCliente;
  actividad: string;
}

function registrationLabel(value?: string): string {
  if (!value) return "Registro reciente";
  const days = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / (24 * 60 * 60 * 1000)),
  );
  if (days === 0) return "Registro · hoy";
  if (days === 1) return "Registro · ayer";
  return `Registro · hace ${days} d`;
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Máximo de clientes visibles (2 columnas x 3 filas en desktop).
const VISIBLE_MAX = 6;

export function AdminRecentCustomers() {
  const [selected, setSelected] = useState<AdminCliente | null>(null);
  const [listAviso, setListAviso] = useState(false);

  const recent: RecentCustomer[] = ADMIN_DATA.clientes
    .map((cliente) => ({
      cliente,
      actividad: registrationLabel(cliente.createdAt),
    }))
    .sort(
      (a, b) =>
        Date.parse(b.cliente.createdAt ?? "") -
        Date.parse(a.cliente.createdAt ?? ""),
    );
  const visibles = recent.slice(0, VISIBLE_MAX);
  const hasMore = recent.length > VISIBLE_MAX;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Clientes recientes</h2>

      <div className={styles.list}>
        {visibles.map(({ cliente, actividad }) => (
          <button
            key={cliente.email}
            type="button"
            className={styles.item}
            onClick={() => setSelected(cliente)}
          >
            <span className={styles.avatar}>{iniciales(cliente.nombre)}</span>
            <div className={styles.info}>
              <div className={styles.name}>{cliente.nombre}</div>
              <div className={styles.email}>{cliente.email}</div>
            </div>
            <div className={styles.side}>
              <span className={styles.puntos}>
                {cliente.puntos.toLocaleString("es-CL")} pts
              </span>
              <span className={styles.actividad}>{actividad}</span>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className={styles.moreRow}>
          <button
            type="button"
            className={styles.moreLink}
            onClick={() => setListAviso(true)}
          >
            Ver más clientes
          </button>
          {listAviso && (
            <span className={styles.listAviso}>
              Vista completa disponible en la sección Clientes.
            </span>
          )}
        </div>
      )}

      <AdminCustomerDrawer
        customer={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
