import { Drawer } from "../ui";
import type { UnifiedSale } from "../../integration/types";
import styles from "./AdminSaleDetailDrawer.module.css";

interface AdminSaleDetailDrawerProps {
  sale: UnifiedSale | null;
  shopifyAdminUrl: string;
  onClose: () => void;
}

function shopifyOrderUrl(shopifyAdminUrl: string, sale: UnifiedSale) {
  if (!sale.shopifyOrderId) return null;
  const numericId = sale.shopifyOrderId.split("/").pop();
  return numericId ? `${shopifyAdminUrl}/orders/${numericId}` : null;
}

function payBadgeClass(estado: UnifiedSale["estadoPago"]) {
  switch (estado) {
    case "Pagado":
      return styles.pagado;
    case "Rechazado":
      return styles.reembolsado;
    default:
      return styles.pendiente;
  }
}

// Detalle transaccional de una venta (online o física): orden Shopify, pago,
// boleta, puntos y referencia TUU cuando existe.
export function AdminSaleDetailDrawer({
  sale,
  shopifyAdminUrl,
  onClose,
}: AdminSaleDetailDrawerProps) {
  const orderUrl = sale ? shopifyOrderUrl(shopifyAdminUrl, sale) : null;

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
            {sale.email ? (
              <div className={styles.email}>{sale.email}</div>
            ) : null}
            <div className={styles.totalRow}>
              <span className={styles.total}>{sale.total}</span>
              <span
                className={`${styles.payBadge} ${payBadgeClass(sale.estadoPago)}`}
              >
                {sale.estadoPago}
              </span>
            </div>
          </div>

          <div className={styles.body}>
            {sale.productos.length > 0 ? (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Productos</div>
                <div className={styles.stack}>
                  {sale.productos.map((p, index) => (
                    <div
                      key={`${p.nombre}-${index}`}
                      className={styles.product}
                    >
                      <span className={styles.productName}>{p.nombre}</span>
                      <span className={styles.productMeta}>
                        x{p.qty} · {p.precio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Origen</span>
                <span className={styles.rowValue}>{sale.origenLabel}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Fecha</span>
                <span className={styles.rowValue}>{sale.fecha}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Método de pago</span>
                <span className={styles.rowValue}>{sale.metodoPago}</span>
              </div>
              {sale.referenciaPago ? (
                <div className={styles.row}>
                  <span className={styles.rowLabel}>Referencia de pago</span>
                  <span className={styles.rowValue}>{sale.referenciaPago}</span>
                </div>
              ) : null}
              <div className={styles.row}>
                <span className={styles.rowLabel}>Boleta</span>
                <span className={styles.rowValue}>{sale.boleta}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Puntos generados</span>
                <span className={styles.rowValue}>{sale.puntos} pts</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Estado de puntos</span>
                <span className={styles.rowValue}>
                  {sale.loyaltyStatus === "processed"
                    ? "Procesados"
                    : sale.loyaltyStatus === "skipped"
                      ? "No aplica"
                      : sale.loyaltyStatus === "failed"
                        ? "Con error"
                        : "Pendientes"}
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Canal</span>
                <span className={styles.rowValue}>{sale.detalleCanal}</span>
              </div>
            </div>

            {sale.productos.length === 0 ? (
              <p className={styles.note}>
                El detalle de líneas de esta orden vive en Shopify. Ábrela para
                revisar productos, variantes y descuentos aplicados.
              </p>
            ) : null}
          </div>

          <div className={styles.footer}>
            <div className={styles.footerGrid}>
              {orderUrl ? (
                <a
                  className={styles.secondaryBtn}
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver en Shopify
                </a>
              ) : null}
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
