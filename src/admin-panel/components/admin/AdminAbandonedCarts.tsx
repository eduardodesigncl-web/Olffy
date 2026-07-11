import { useState } from "react";
import { Modal } from "../ui/Modal";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminAbandonedCarts.module.css";

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

// Abandono de carrito con datos nativos de Shopify (fuente inicial del plan;
// Klaviyo podrá complementar cuando esté contratado). Si el Admin API no está
// disponible, se informa explícitamente: nunca se muestran datos inventados.
export function AdminAbandonedCarts() {
  const [open, setOpen] = useState(false);
  const data = adminPanelRuntime.data?.abandonedCheckouts;

  if (!data || !data.available) {
    return (
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.panelTitle}>Abandono de carrito</h2>
        </div>
        <p className={styles.unavailable}>
          La fuente Shopify no está disponible en este momento
          {data?.error ? " (Admin API sin acceso)" : ""}. Los checkouts
          abandonados se mostrarán aquí cuando la conexión se restablezca.
        </p>
      </div>
    );
  }

  const ultimo = data.checkouts[0];

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.panelTitle}>Abandono de carrito</h2>
        {data.count > 0 ? (
          <button
            type="button"
            className={styles.action}
            onClick={() => setOpen(true)}
          >
            Ver abandonos
          </button>
        ) : null}
      </div>

      <div className={styles.summary}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Checkouts abandonados</span>
          <span className={`${styles.statValue} ${styles.accentMorado}`}>
            {data.count}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Monto posible en carritos</span>
          <span className={`${styles.statValue} ${styles.accentNaranjo}`}>
            {fmt(data.totalAmount)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Último abandono</span>
          <span className={styles.statValue}>
            {ultimo ? dateLabel(ultimo.createdAt) : "—"}
          </span>
        </div>
      </div>

      <p className={styles.sourceNote}>
        Fuente: Shopify · actualizado {dateLabel(data.fetchedAt)}
      </p>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        panelClassName={styles.modalPanel}
      >
        <div className={styles.modalInner}>
          <div className={styles.modalHead}>
            <h3 className={styles.modalTitle}>Checkouts abandonados</h3>
            <p className={styles.modalSubtitle}>
              Datos nativos de Shopify. Un checkout que luego compró no se
              cuenta como abandonado.
            </p>
          </div>

          <div className={styles.list}>
            {data.checkouts.map((checkout) => (
              <div key={checkout.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <span className={styles.itemCliente}>
                    {checkout.customerEmail ?? "Anónimo"}
                  </span>
                  <span className={styles.itemMeta}>
                    {dateLabel(checkout.createdAt)}
                  </span>
                </div>
                {checkout.lineItems.length > 0 ? (
                  <div className={styles.itemProductos}>
                    {checkout.lineItems.join(" · ")}
                  </div>
                ) : null}
                <div className={styles.itemTotal}>
                  Total estimado: {fmt(checkout.totalPrice)}
                </div>
              </div>
            ))}
            {data.checkouts.length === 0 ? (
              <p className={styles.unavailable}>
                No hay checkouts abandonados en el período consultado.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
