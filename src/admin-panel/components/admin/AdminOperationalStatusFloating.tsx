import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import {
  AdminOperationalStatus,
  OPERATIONAL_SYSTEMS,
  stateFromDiagnostic,
  type SystemState,
} from "./AdminOperationalStatus";
import { useAdminDiagnostics } from "./useAdminDiagnostics";
import styles from "./AdminOperationalStatusFloating.module.css";
import type { AdminIntegrationDiagnostic } from "lib/admin/diagnostics-types";

function priorityRank(state: SystemState) {
  if (state === "error") return 5;
  if (state === "requiere") return 4;
  if (state === "degradado") return 3;
  if (state === "pendiente") return 2;
  if (state === "mock") return 1;
  return 0;
}

function highestPriority(
  diagnostics?: AdminIntegrationDiagnostic[] | null,
): SystemState {
  const states = diagnostics?.length
    ? diagnostics.map(stateFromDiagnostic)
    : OPERATIONAL_SYSTEMS.map((s) => s.state);

  return states.reduce<SystemState>(
    (current, state) =>
      priorityRank(state) > priorityRank(current) ? state : current,
    "conectado",
  );
}

function formatCheckedAt(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminOperationalStatusFloating() {
  const [open, setOpen] = useState(false);
  const { diagnostics, checkedAt, loading, error, refresh } =
    useAdminDiagnostics(open);
  const priority = highestPriority(diagnostics);
  const checkedAtLabel = formatCheckedAt(checkedAt);

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
            <div>
              <h3 className={styles.popTitle}>Estado operativo</h3>
              <p className={styles.popMeta}>
                {loading
                  ? "Diagnosticando..."
                  : checkedAtLabel
                    ? `Actualizado ${checkedAtLabel}`
                    : "Diagnóstico real de APIs"}
              </p>
            </div>
            <div className={styles.popActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => void refresh()}
                aria-label="Actualizar diagnóstico"
                title="Actualizar"
                disabled={loading}
              >
                <RefreshCw size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Cerrar estado operativo"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
          <AdminOperationalStatus diagnostics={diagnostics} />
        </div>
      )}
    </div>
  );
}
