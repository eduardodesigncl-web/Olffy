// @ts-nocheck
import { useState } from "react";
import { Modal } from "../ui/Modal";
import styles from "./AdminAbandonedCarts.module.css";

// Abandono de carrito (mock local). No conecta CartContext ni backend: los
// carritos viven en esta constante solo para poblar la vista del dashboard.
type AbandonedStatus = "pendiente" | "recuperado" | "expirado";

interface AbandonedCart {
  id: number;
  cliente: string;
  fecha: string;
  productos: string[];
  total: number;
  estado: AbandonedStatus;
}

const STATUS_LABEL: Record<AbandonedStatus, string> = {
  pendiente: "Pendiente",
  recuperado: "Recuperado",
  expirado: "Expirado",
};

const ABANDONED: AbandonedCart[] = [
  {
    id: 1,
    cliente: "Camila Torres",
    fecha: "Hoy · 14:32",
    productos: ["Cuaderno Ilustrado A5", "Set de stickers"],
    total: 14980,
    estado: "pendiente",
  },
  {
    id: 2,
    cliente: "Anónimo",
    fecha: "Hoy · 11:05",
    productos: ["Agenda Semanal 2025"],
    total: 12990,
    estado: "pendiente",
  },
  {
    id: 3,
    cliente: "Valentina García",
    fecha: "Ayer · 19:47",
    productos: ["Lámina decorativa", "Cuaderno Ilustrado A5", "Lápices pastel"],
    total: 23970,
    estado: "recuperado",
  },
  {
    id: 4,
    cliente: "Anónimo",
    fecha: "Ayer · 09:20",
    productos: ["Tote bag OLFFY"],
    total: 9990,
    estado: "expirado",
  },
];

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Resumen del dashboard: total abandonados, último y monto estimado perdido.
export function AdminAbandonedCarts() {
  const [open, setOpen] = useState(false);

  // Monto "perdido" = carritos que no se recuperaron.
  const perdido = ABANDONED.filter((c) => c.estado !== "recuperado").reduce(
    (s, c) => s + c.total,
    0,
  );
  const ultimo = ABANDONED[0];

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.panelTitle}>Abandono de carrito</h2>
        <button
          type="button"
          className={styles.action}
          onClick={() => setOpen(true)}
        >
          Ver abandonos
        </button>
      </div>

      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Carritos abandonados</span>
          <span className={`${styles.statValue} ${styles.accentMorado}`}>
            {ABANDONED.length}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            Monto posible total en carrito
          </span>
          <span className={`${styles.statValue} ${styles.accentNaranjo}`}>
            {fmt(perdido)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Último abandono</span>
          <span className={styles.statValue}>{ultimo.fecha}</span>
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        panelClassName={styles.modalPanel}
      >
        <div className={styles.modalInner}>
          <div className={styles.modalHead}>
            <h3 className={styles.modalTitle}>Carritos abandonados</h3>
            <p className={styles.modalSubtitle}>
              Vista mock · sin conexión a checkout real.
            </p>
          </div>

          <div className={styles.list}>
            {ABANDONED.map((c) => (
              <div key={c.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemCliente}>{c.cliente}</span>
                  <span className={`${styles.badge} ${styles[c.estado]}`}>
                    {STATUS_LABEL[c.estado]}
                  </span>
                </div>
                <div className={styles.itemMeta}>{c.fecha}</div>
                <div className={styles.itemProductos}>
                  {c.productos.join(" · ")}
                </div>
                <div className={styles.itemTotal}>
                  Total estimado: {fmt(c.total)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
