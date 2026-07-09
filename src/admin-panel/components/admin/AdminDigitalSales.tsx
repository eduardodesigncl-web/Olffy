// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminSearchInput } from "./AdminSearchInput";
import { AdminDigitalSaleDetailDrawer } from "./AdminDigitalSaleDetailDrawer";
import {
  DIGITAL_SALES,
  type DigitalSale,
} from "../../data/adminDigitalSales.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminDigitalSales.module.css";

// Sección Ventas digitales del panel admin.
// AdminDigitalSales mock: visualiza ventas online que en producción provienen de
// Shopify (pagadas por la pasarela, ej. Mercado Pago). No es un POS; no registra
// ventas manualmente ni modifica datos reales.

export function AdminDigitalSales() {
  const shopifyOrdersUrl = `${
    adminPanelRuntime.data?.shopifyAdminUrl ?? "https://admin.shopify.com"
  }/orders`;
  const [searchTerm, setSearchTerm] = useState("");
  const [detail, setDetail] = useState<DigitalSale | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const metrics: AdminMetricCardData[] = useMemo(() => {
    const pagadas = DIGITAL_SALES.filter((s) => s.estadoPago === "Pagado");
    const totalOnline = pagadas.reduce((sum, s) => sum + s.totalN, 0);
    const mp = DIGITAL_SALES.filter(
      (s) => s.metodoPago === "Mercado Pago",
    ).length;
    const identificados = DIGITAL_SALES.filter(
      (s) => !s.cliente.toLowerCase().includes("invitado"),
    ).length;
    return [
      {
        label: "Ventas digitales hoy",
        value: DIGITAL_SALES.length,
        tone: "morado",
      },
      {
        label: "Total vendido online",
        value: `$${totalOnline.toLocaleString("es-CL")}`,
        tone: "morado",
      },
      { label: "Órdenes pagadas", value: pagadas.length, tone: "verde" },
      { label: "Pagos Mercado Pago", value: mp, tone: "amarillo" },
      {
        label: "Clientes identificados",
        value: identificados,
        tone: "naranjo",
      },
    ];
  }, [DIGITAL_SALES.length]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return DIGITAL_SALES;
    return DIGITAL_SALES.filter(
      (s) =>
        s.folio.toLowerCase().includes(q) ||
        s.cliente.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.metodoPago.toLowerCase().includes(q) ||
        s.estadoPago.toLowerCase().includes(q),
    );
  }, [searchTerm]);

  const handleSync = () =>
    setNotice("Venta sincronizada desde Shopify en modo demo.");
  const handleOpenShopify = () => {
    window.open(shopifyOrdersUrl, "_blank", "noopener,noreferrer");
    setNotice("Abriendo Shopify Admin en una nueva pestaña.");
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Ventas digitales</h1>
        <p className={styles.subtitle}>
          Revisa las ventas registradas desde Shopify, sus pagos, productos,
          clientas asociadas y puntos estimados.
        </p>
      </div>

      <div className={styles.metrics}>
        {metrics.map((m) => (
          <AdminMetricCard key={m.label} metric={m} />
        ))}
      </div>

      {notice && (
        <div className={styles.notice}>
          <svg
            className={styles.noticeIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16.5h.01" />
          </svg>
          <span className={styles.noticeText}>{notice}</span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.searchRow}>
        <AdminSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por folio, cliente, email, pago o estado..."
        />
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Folio</th>
              <th className={styles.th}>Cliente</th>
              <th className={styles.th}>Fecha</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Pago</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Canal</th>
              <th className={styles.th}>Puntos</th>
              <th className={styles.th} aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className={styles.row}>
                <td className={`${styles.td} ${styles.folio}`}>{s.folio}</td>
                <td className={styles.td}>
                  <div className={styles.cliente}>{s.cliente}</div>
                  <div className={styles.email}>{s.email}</div>
                </td>
                <td className={`${styles.td} ${styles.muted}`}>{s.fecha}</td>
                <td className={`${styles.td} ${styles.total}`}>{s.total}</td>
                <td className={`${styles.td} ${styles.muted}`}>
                  {s.metodoPago}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.payBadge} ${styles[`pay${s.estadoPago}`]}`}
                  >
                    {s.estadoPago}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.muted}`}>{s.canal}</td>
                <td className={styles.td}>{s.puntos} pts</td>
                <td className={styles.td}>
                  <button
                    type="button"
                    className={styles.detailBtn}
                    onClick={() => setDetail(s)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminDigitalSaleDetailDrawer
        sale={detail}
        onClose={() => setDetail(null)}
        onSync={handleSync}
        onOpenShopify={handleOpenShopify}
      />
    </div>
  );
}
