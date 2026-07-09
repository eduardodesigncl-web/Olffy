// @ts-nocheck
import { Drawer } from "../ui";
import type { DigitalSale } from "../../data/adminDigitalSales.mock";
import styles from "./AdminDigitalSaleDetailDrawer.module.css";

interface AdminDigitalSaleDetailDrawerProps {
  sale: DigitalSale | null;
  onClose: () => void;
  onSync: (sale: DigitalSale) => void;
  onOpenShopify: (sale: DigitalSale) => void;
}

// Detalle de venta digital (mock/local). En producción, los puntos se calculan
// al confirmar el pago y se registran como transacción auditable en Supabase.
export function AdminDigitalSaleDetailDrawer({
  sale,
  onClose,
  onSync,
  onOpenShopify,
}: AdminDigitalSaleDetailDrawerProps) {
  return (
    <Drawer
      isOpen={sale !== null}
      onClose={onClose}
      side="right"
      panelClassName={styles.panel}
    >
      {sale && (
        <div className={styles.detail}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              ✕
            </button>
            <div className={styles.folio}>{sale.folio}</div>
            <div className={styles.cliente}>{sale.cliente}</div>
            <div className={styles.email}>{sale.email}</div>
            <div className={styles.totalRow}>
              <span className={styles.total}>{sale.total}</span>
              <span
                className={`${styles.payBadge} ${styles[sale.estadoPago.toLowerCase()]}`}
              >
                {sale.estadoPago}
              </span>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Productos comprados</div>
              <div className={styles.stack}>
                {sale.productos.map((p) => (
                  <div key={p.nombre} className={styles.product}>
                    <span className={styles.productName}>{p.nombre}</span>
                    <span className={styles.productMeta}>
                      x{p.qty} · {p.precio}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Método de pago</span>
                <span className={styles.rowValue}>{sale.metodoPago}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Estado de pago</span>
                <span className={styles.rowValue}>{sale.estadoPago}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Canal</span>
                <span className={styles.rowValue}>{sale.canal}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Puntos estimados</span>
                <span className={styles.rowValue}>{sale.puntos} pts</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Sincronización Supabase</span>
                <span className={styles.rowValue}>
                  {sale.supabaseSync
                    ? "Sincronizado en modo demo"
                    : "Sin sincronizar"}
                </span>
              </div>
            </div>

            <p className={styles.note}>
              Venta digital registrada desde Shopify. En producción, los puntos
              se calculan al confirmar el pago y se registran como transacción
              auditable en Supabase.
            </p>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onSync(sale)}
            >
              Sincronizar puntos
            </button>
            <div className={styles.footerGrid}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => onOpenShopify(sale)}
              >
                Ver en Shopify
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
