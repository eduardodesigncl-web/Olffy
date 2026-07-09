// @ts-nocheck
import { useState } from "react";
import { AdminCustomerDrawer } from "./AdminCustomerDrawer";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminRecentCustomers.module.css";

// Clientes recientes (mock). Los primeros salen de ADMIN_DATA para rimar con la
// sección Clientes; se agregan un par locales solo para poblar la vista.
// Cada item lleva su AdminCliente para reutilizar el drawer de detalle de Clientes.
interface RecentCustomer {
  cliente: AdminCliente;
  actividad: string;
}

const ACTIVIDAD_BASE = ["Compra · hoy", "Canje · ayer", "Compra · hace 2 d"];

const EXTRA: RecentCustomer[] = [
  {
    cliente: {
      idx: 101,
      nombre: "Josefa Ríos",
      email: "jose@example.com",
      puntos: 120,
      estado: "Nuevo",
    },
    actividad: "Registro · hoy",
  },
  {
    cliente: {
      idx: 102,
      nombre: "Ignacia Soto",
      email: "igna@example.com",
      puntos: 60,
      estado: "Nuevo",
    },
    actividad: "Registro · ayer",
  },
];

const RECENT: RecentCustomer[] = [
  ...ADMIN_DATA.clientes.map((c, i) => ({
    cliente: c,
    actividad: ACTIVIDAD_BASE[i] ?? "Actividad reciente",
  })),
  ...EXTRA,
].slice(0, 5);

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

  const visibles = RECENT.slice(0, VISIBLE_MAX);
  const hasMore = RECENT.length > VISIBLE_MAX;

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
