// @ts-nocheck
import { useState } from "react";
import {
  AdminOperationalStatus,
  OPERATIONAL_SYSTEMS,
  type SystemState,
} from "./AdminOperationalStatus";
import styles from "./AdminOperationalStatusFloating.module.css";

// Estado operativo como herramienta flotante del dashboard (mock/local).
// El color del botón refleja el estado de mayor prioridad presente.
function highestPriority(): SystemState {
  if (OPERATIONAL_SYSTEMS.some((s) => s.state === "requiere"))
    return "requiere";
  if (OPERATIONAL_SYSTEMS.some((s) => s.state === "pendiente"))
    return "pendiente";
  return "mock";
}

export function AdminOperationalStatusFloating() {
  const [open, setOpen] = useState(false);
  const priority = highestPriority();

  return (
    <div className={styles.floating}>
      <button
        type="button"
        className={`${styles.button} ${styles[priority]}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Ver estado operativo"
        aria-expanded={open}
        title="Estado operativo"
      >
        {/* Ícono de enchufe con cable unido al cuerpo; hereda el color del estado vía currentColor. */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 2v4M15 2v4" />
          <path d="M7 6h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V6z" />
          <path d="M12 14v4a3 3 0 0 0 3 3h2" />
        </svg>
      </button>

      {open && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label="Estado operativo"
        >
          <div className={styles.popHead}>
            <h3 className={styles.popTitle}>Estado operativo</h3>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="Cerrar estado operativo"
            >
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
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <AdminOperationalStatus />
        </div>
      )}
    </div>
  );
}
