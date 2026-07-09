// @ts-nocheck
import { useMemo, useState } from "react";
import { AdminSearchInput } from "./AdminSearchInput";
import styles from "./AdminSaleHistoryMock.module.css";

export interface SaleHistoryEntry {
  id: number;
  folio: string;
  total: string;
  pts: string;
  cliente: string;
  responsable: string;
}

interface AdminSaleHistoryMockProps {
  sales: SaleHistoryEntry[];
}

// Últimas ventas físicas (solo lectura, mock) + búsqueda por folio.
export function AdminSaleHistoryMock({ sales }: AdminSaleHistoryMockProps) {
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.folio.toLowerCase().includes(q));
  }, [sales, term]);

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.stepBadge}>6</span>
        <h2 className={styles.title}>Buscar venta por folio</h2>
      </div>
      <AdminSearchInput
        value={term}
        onChange={setTerm}
        placeholder="Buscar folio TUU…"
      />

      <h3 className={styles.subtitle}>Últimas ventas físicas</h3>
      {filtered.length === 0 ? (
        <div className={styles.empty}>No encontramos ventas con ese folio.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((s) => (
            <div key={s.id} className={styles.item}>
              <span className={styles.folio}>{s.folio}</span>
              <div className={styles.info}>
                <div className={styles.cliente}>{s.cliente}</div>
                <div className={styles.responsable}>
                  Responsable: {s.responsable}
                </div>
              </div>
              <span className={styles.total}>{s.total}</span>
              <span className={styles.pts}>{s.pts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
