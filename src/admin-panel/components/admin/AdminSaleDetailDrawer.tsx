import { useCallback, useEffect, useState } from "react";
import { Drawer } from "../ui";
import type { UnifiedSale, UnifiedSaleDetail } from "../../integration/types";
import styles from "./AdminSaleDetailDrawer.module.css";

interface AdminSaleDetailDrawerProps {
  sale: UnifiedSale | null;
  shopifyAdminUrl: string;
  onClose: () => void;
  onBack?: () => void;
}

type DetailPayload = {
  sale?: UnifiedSaleDetail;
  error?: string;
};

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

function loyaltyLabel(status: string) {
  if (status === "processed") return "Procesados";
  if (status === "skipped") return "No aplica";
  if (status === "failed") return "Con error";
  return "Pendientes";
}

export function AdminSaleDetailDrawer({
  sale,
  shopifyAdminUrl,
  onClose,
  onBack,
}: AdminSaleDetailDrawerProps) {
  const [detail, setDetail] = useState<UnifiedSaleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadDetail = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!sale) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setError(null);
    setLoading(true);
    void fetch(`/api/admin/sales/${encodeURIComponent(sale.id)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as DetailPayload;
        if (!response.ok || !payload.sale) {
          throw new Error(payload.error || "No se pudo cargar el detalle");
        }
        setDetail(payload.sale);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar el detalle de la venta",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey, sale]);

  const displayedSale = detail ?? sale;
  const orderUrl = displayedSale
    ? shopifyOrderUrl(shopifyAdminUrl, displayedSale)
    : null;

  return (
    <Drawer
      isOpen={sale !== null}
      onClose={onClose}
      side="right"
      panelClassName={styles.panel}
    >
      {displayedSale && (
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
            <div className={styles.headerMeta}>
              <span className={styles.channelBadge}>
                {displayedSale.origen === "fisica"
                  ? "Venta presencial"
                  : "Venta online"}
              </span>
              <span>{displayedSale.fecha}</span>
            </div>
            <div className={styles.folio}>{displayedSale.folio}</div>
            <div className={styles.cliente}>{displayedSale.cliente}</div>
            {displayedSale.email ? (
              <div className={styles.email}>{displayedSale.email}</div>
            ) : null}
            <div className={styles.totalRow}>
              <span className={styles.total}>{displayedSale.total}</span>
              <span
                className={`${styles.payBadge} ${payBadgeClass(displayedSale.estadoPago)}`}
              >
                {displayedSale.estadoPago}
              </span>
            </div>
          </div>

          <div className={styles.body}>
            {loading ? (
              <div className={styles.loading} role="status">
                Cargando líneas y contexto de la venta…
              </div>
            ) : error ? (
              <div className={styles.error} role="alert">
                <strong>No se pudo cargar el detalle completo.</strong>
                <span>{error}</span>
                <button type="button" onClick={loadDetail}>
                  Reintentar
                </button>
              </div>
            ) : detail ? (
              <>
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>Productos</div>
                  {detail.productos.length > 0 ? (
                    <div className={styles.stack}>
                      {detail.productos.map((product) => (
                        <article key={product.id} className={styles.product}>
                          <div className={styles.productImage}>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.imageAlt}
                              />
                            ) : (
                              <span aria-hidden="true">OLFFY</span>
                            )}
                          </div>
                          <div className={styles.productInfo}>
                            <strong>{product.nombre}</strong>
                            <span>
                              {[
                                product.variante,
                                product.sku ? `SKU ${product.sku}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Variante única"}
                            </span>
                            {!product.elegible ? (
                              <em>No acumula puntos</em>
                            ) : null}
                          </div>
                          <dl className={styles.lineAmounts}>
                            <div>
                              <dt>Cantidad</dt>
                              <dd>{product.qty}</dd>
                            </div>
                            <div>
                              <dt>Precio unitario</dt>
                              <dd>{product.precio}</dd>
                            </div>
                            <div>
                              <dt>Descuento</dt>
                              <dd>{product.descuento}</dd>
                            </div>
                            <div>
                              <dt>Total línea</dt>
                              <dd>{product.pagado}</dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.note}>
                      Esta venta no tiene líneas registradas para mostrar.
                    </p>
                  )}
                </section>

                <section className={styles.totals} aria-label="Totales">
                  <div>
                    <span>Subtotal</span>
                    <strong>{detail.subtotal}</strong>
                  </div>
                  <div>
                    <span>Descuento</span>
                    <strong>-{detail.descuento}</strong>
                  </div>
                  {detail.ajustesN !== 0 ? (
                    <div>
                      <span>Despacho, impuestos o ajustes</span>
                      <strong>{detail.ajustes}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span>Total</span>
                    <strong>{detail.total}</strong>
                  </div>
                </section>

                <div className={styles.rows}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Canal</span>
                    <span className={styles.rowValue}>
                      {detail.origenLabel} · {detail.detalleCanal}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Método de pago</span>
                    <span className={styles.rowValue}>{detail.metodoPago}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Estado del pago</span>
                    <span className={styles.rowValue}>{detail.estadoPago}</span>
                  </div>
                  {detail.referenciaPago ? (
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>
                        Referencia de pago
                      </span>
                      <span className={styles.rowValue}>
                        {detail.referenciaPago}
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Boleta</span>
                    <span className={styles.rowValue}>{detail.boleta}</span>
                  </div>
                  {detail.numeroComprobante ? (
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>
                        Número de comprobante
                      </span>
                      <span className={styles.rowValue}>
                        {detail.numeroComprobante}
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Responsable</span>
                    <span className={styles.rowValue}>
                      {detail.responsable}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Estado de puntos</span>
                    <span className={styles.rowValue}>
                      {loyaltyLabel(detail.loyaltyStatus)} · {detail.puntos} pts
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Monto elegible</span>
                    <span className={styles.rowValue}>
                      {detail.montoElegible}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Monto excluido</span>
                    <span className={styles.rowValue}>
                      {detail.montoExcluido}
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Regla aplicada</span>
                    <span className={styles.rowValue}>
                      {detail.reglaAplicada}
                    </span>
                  </div>
                </div>
                {detail.notas ? (
                  <p className={styles.note}>
                    <strong>Notas:</strong> {detail.notas}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <div className={styles.footer}>
            <div className={styles.footerGrid}>
              {onBack ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={onBack}
                >
                  Volver a la clienta
                </button>
              ) : null}
              {orderUrl ? (
                <a
                  className={styles.secondaryBtn}
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en Shopify
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
