// @ts-nocheck
import styles from "./AdminSaleSuccessMock.module.css";

export interface SaleResult {
  folio: string;
  total: number;
  puntos: number;
  clienteNombre: string | null;
  responsable: string;
  itemCount: number;
}

interface AdminSaleSuccessMockProps {
  sale: SaleResult;
  onNewSale: () => void;
  onViewPoints: () => void;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Confirmación mock de venta física registrada (vista final). El carrito se
// limpia al volver al panel de ventas (handler onNewSale del contenedor).
export function AdminSaleSuccessMock({
  sale,
  onNewSale,
  onViewPoints,
}: AdminSaleSuccessMockProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.badge}>
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12.5l5 5 11-11" />
          </svg>
        </span>
        <div>
          <div className={styles.title}>Venta registrada</div>
          <div className={styles.folio}>Folio {sale.folio}</div>
        </div>
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Total</span>
          <span className={`${styles.rowValue} ${styles.total}`}>
            {fmt(sale.total)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Puntos estimados</span>
          <span className={`${styles.rowValue} ${styles.pts}`}>
            {sale.puntos.toLocaleString("es-CL")} pts
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Cliente</span>
          <span className={styles.rowValue}>
            {sale.clienteNombre ?? "Venta sin cliente"}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Responsable</span>
          <span className={styles.rowValue}>{sale.responsable}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Productos</span>
          <span className={styles.rowValue}>
            {sale.itemCount} {sale.itemCount === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      <p className={styles.message}>
        Venta física registrada. El backend sincronizó la operación con
        Shopify/Supabase según las credenciales e integraciones configuradas.
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onNewSale}>
          Volver al panel de ventas
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={onViewPoints}
        >
          Ver movimientos de puntos
        </button>
      </div>
    </div>
  );
}
