// @ts-nocheck
import { useMemo, useState } from "react";
import { AdminSearchInput } from "./AdminSearchInput";
import styles from "./AdminSalesDayDetail.module.css";

interface AdminSalesDayDetailProps {
  onBack: () => void;
}

// Normaliza montos/consultas: quita "$" y puntos para permitir buscar el total
// con o sin formato (ej. "21980", "21.980", "$21.980").
function normNum(s: string): string {
  return s.replace(/[$.]/g, "");
}

// Detalle "Ventas del día" (mock/local): resumen, listado y gráficos CSS
// (sin librerías) de distribución por método de pago y por canal.
interface DaySale {
  folio: string;
  cliente: string;
  canal: string;
  metodo: string;
  total: string;
}

const DAY_SALES: DaySale[] = [
  {
    folio: "#OLF-5210",
    cliente: "Valentina García",
    canal: "Web / Shopify",
    metodo: "Mercado Pago",
    total: "$21.980",
  },
  {
    folio: "TUU-1042",
    cliente: "Camila Torres",
    canal: "Punto físico",
    metodo: "Débito",
    total: "$12.990",
  },
  {
    folio: "TUU-1041",
    cliente: "Venta sin cliente",
    canal: "Punto físico",
    metodo: "Efectivo",
    total: "$8.990",
  },
  {
    folio: "#OLF-5209",
    cliente: "Camila Torres",
    canal: "Web / Shopify",
    metodo: "Mercado Pago",
    total: "$12.990",
  },
  {
    folio: "TUU-1040",
    cliente: "Milenka Burgos",
    canal: "Punto físico",
    metodo: "Crédito",
    total: "$24.990",
  },
];

interface BarDatum {
  label: string;
  value: number;
  cls: string;
}

const PAYMENT_DIST: BarDatum[] = [
  { label: "Débito", value: 32, cls: styles.morado },
  { label: "Crédito", value: 24, cls: styles.naranjo },
  { label: "Efectivo", value: 14, cls: styles.amarillo },
  { label: "Mercado Pago", value: 30, cls: styles.verde },
];

const CHANNEL_DIST: BarDatum[] = [
  { label: "Web / Shopify", value: 58, cls: styles.morado },
  { label: "Punto físico", value: 42, cls: styles.naranjo },
];

function BarChart({ title, data }: { title: string; data: BarDatum[] }) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{title}</div>
      <div className={styles.bars}>
        {data.map((d) => (
          <div key={d.label} className={styles.barRow}>
            <span className={styles.barLabel}>{d.label}</span>
            <span className={styles.barTrack}>
              <span
                className={`${styles.barFill} ${d.cls}`}
                style={{ width: `${d.value}%` }}
              />
            </span>
            <span className={styles.barPct}>{d.value}%</span>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        {data.map((d) => (
          <span key={d.label} className={styles.legendItem}>
            <span className={`${styles.legendDot} ${d.cls}`} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminSalesDayDetail({ onBack }: AdminSalesDayDetailProps) {
  const [salesQuery, setSalesQuery] = useState("");

  const filteredSales = useMemo(() => {
    const q = salesQuery.trim().toLowerCase();
    if (!q) return DAY_SALES;
    const qNum = normNum(q);
    return DAY_SALES.filter((s) => {
      const textMatch = [s.folio, s.cliente, s.canal, s.metodo, s.total].some(
        (f) => f.toLowerCase().includes(q),
      );
      const numMatch = qNum.length > 0 && normNum(s.total).includes(qNum);
      return textMatch || numMatch;
    });
  }, [salesQuery]);

  return (
    <div>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver al resumen
      </button>

      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Ventas del día</h1>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>$384.780</span>
          <span className={styles.summaryLabel}>Total del día</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>18</span>
          <span className={styles.summaryLabel}>Ventas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>$21.377</span>
          <span className={styles.summaryLabel}>Ticket promedio</span>
        </div>
      </div>

      <div className={styles.charts}>
        <BarChart title="Distribución por método de pago" data={PAYMENT_DIST} />
        <BarChart title="Distribución por canal" data={CHANNEL_DIST} />
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Ventas del día</h2>

        <div className={styles.searchRow}>
          <AdminSearchInput
            value={salesQuery}
            onChange={setSalesQuery}
            placeholder="Buscar por folio, cliente, canal, método o total..."
          />
        </div>

        {filteredSales.length === 0 ? (
          <div className={styles.empty}>
            No se encontraron ventas con ese criterio.
          </div>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Folio</th>
                  <th className={styles.th}>Cliente</th>
                  <th className={styles.th}>Canal</th>
                  <th className={styles.th}>Método</th>
                  <th className={styles.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s) => (
                  <tr key={s.folio} className={styles.row}>
                    <td className={`${styles.td} ${styles.folio}`}>
                      {s.folio}
                    </td>
                    <td className={styles.td}>{s.cliente}</td>
                    <td className={`${styles.td} ${styles.muted}`}>
                      {s.canal}
                    </td>
                    <td className={`${styles.td} ${styles.muted}`}>
                      {s.metodo}
                    </td>
                    <td className={`${styles.td} ${styles.total}`}>
                      {s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
