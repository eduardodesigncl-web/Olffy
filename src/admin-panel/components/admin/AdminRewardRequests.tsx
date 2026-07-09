// @ts-nocheck
import type { AdminCanje } from "../../data/adminData.mock";
import styles from "./AdminRewardRequests.module.css";

interface AdminRewardRequestsProps {
  requests: AdminCanje[];
  onMockAction: () => void;
}

// Solicitudes de canje pendientes (lectura). Aprobar / Rechazar / Ver cliente
// son mock: disparan un aviso, no cambian el estado de la solicitud.
export function AdminRewardRequests({
  requests,
  onMockAction,
}: AdminRewardRequestsProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Solicitudes de canje pendientes</h2>
      {requests.length === 0 ? (
        <div className={styles.empty}>
          No hay solicitudes de canje pendientes.
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((r, idx) => (
            <div key={idx} className={styles.item}>
              <div className={styles.cliente}>
                <div className={styles.clienteNombre}>{r.cliente}</div>
                <div className={styles.fecha}>{r.fecha}</div>
              </div>
              <div className={styles.beneficio}>
                <div className={styles.beneficioNombre}>{r.beneficio}</div>
                <div className={styles.beneficioPts}>{r.pts}</div>
              </div>
              <span className={styles.estado}>{r.estado}</span>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveBtn}
                  onClick={onMockAction}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className={styles.rejectBtn}
                  onClick={onMockAction}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className={styles.viewBtn}
                  onClick={onMockAction}
                >
                  Ver cliente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
