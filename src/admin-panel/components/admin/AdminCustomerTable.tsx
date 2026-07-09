// @ts-nocheck
import type { AdminCliente } from "../../data/adminData.mock";
import { derivePaymentSystem } from "../../data/adminCustomerPayments.mock";
import { AdminCustomerStatusBadge } from "./AdminCustomerStatusBadge";
import styles from "./AdminCustomerTable.module.css";

const PAY_CLASS: Record<string, string> = {
  "Venta física": styles.payFisica,
  "Venta web": styles.payWeb,
  Mixto: styles.payMixto,
  "Sin venta": styles.paySin,
};

interface AdminCustomerTableProps {
  customers: AdminCliente[];
  onSelect: (customer: AdminCliente) => void;
}

function initial(nombre: string): string {
  return nombre.charAt(0).toUpperCase();
}

// Tabla de clientes del admin. En pantallas angostas hace scroll horizontal
// (min-width en la tabla). Solo lectura + acción "Ver detalle".
export function AdminCustomerTable({
  customers,
  onSelect,
}: AdminCustomerTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Cliente</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Teléfono</th>
            <th className={styles.th}>Puntos</th>
            <th className={styles.th}>Sistema de pago</th>
            <th className={styles.th}>Estado</th>
            <th className={styles.th} aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.idx} className={styles.row}>
              <td className={styles.td}>
                <div className={styles.customerCell}>
                  <span className={styles.avatar}>{initial(c.nombre)}</span>
                  <span className={styles.name}>{c.nombre}</span>
                </div>
              </td>
              <td className={`${styles.td} ${styles.muted}`}>{c.email}</td>
              <td className={`${styles.td} ${styles.muted}`}>{c.tel || "—"}</td>
              <td className={styles.td}>
                <span className={styles.points}>
                  {c.puntos.toLocaleString("es-CL")}
                </span>
              </td>
              <td className={styles.td}>
                {(() => {
                  const pay = derivePaymentSystem(c.nombre);
                  return (
                    <span className={`${styles.payBadge} ${PAY_CLASS[pay]}`}>
                      {pay}
                    </span>
                  );
                })()}
              </td>
              <td className={styles.td}>
                <AdminCustomerStatusBadge estado={c.estado} />
              </td>
              <td className={styles.td}>
                <button
                  type="button"
                  className={styles.detailBtn}
                  onClick={() => onSelect(c)}
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
