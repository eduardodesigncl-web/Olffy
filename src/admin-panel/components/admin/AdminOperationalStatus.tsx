import type { AdminIntegrationDiagnostic } from "lib/admin/diagnostics-types";
import styles from "./AdminOperationalStatus.module.css";

export type SystemState =
  | "conectado"
  | "degradado"
  | "pendiente"
  | "mock"
  | "requiere"
  | "error";

export const OPERATIONAL_SYSTEMS: {
  name: string;
  desc: string;
  state: SystemState;
}[] = [
  { name: "Shopify", desc: "Catálogo y checkout", state: "requiere" },
  { name: "Supabase", desc: "Base de datos y puntos", state: "requiere" },
  { name: "TUU", desc: "Pago presencial en tienda", state: "pendiente" },
  { name: "Email", desc: "Campañas y newsletter", state: "mock" },
];

export const STATE_LABEL: Record<SystemState, string> = {
  conectado: "Conectado",
  degradado: "Revisar",
  pendiente: "Pendiente",
  mock: "Mock",
  requiere: "Requiere conexión",
  error: "Error",
};

const STATE_TOOLTIP: Record<SystemState, string> = {
  conectado: "La API respondió correctamente al último diagnóstico.",
  degradado:
    "El servicio responde, pero falta algún permiso o configuración secundaria.",
  pendiente: "Pendiente de conexión real. Actualmente no está integrado.",
  mock: "Funciona solo en modo demo. No envía ni recibe datos reales.",
  requiere:
    "Necesita credenciales o configuración antes de operar en producción.",
  error: "La conexión falló durante el último diagnóstico.",
};

export function stateFromDiagnostic(
  diagnostic: AdminIntegrationDiagnostic,
): SystemState {
  if (diagnostic.status === "connected") return "conectado";
  if (diagnostic.status === "degraded") return "degradado";
  if (diagnostic.status === "pending") return "pendiente";
  if (diagnostic.status === "mock") return "mock";
  if (diagnostic.status === "missing") return "requiere";
  return "error";
}

function rowsFromDiagnostics(
  diagnostics?: AdminIntegrationDiagnostic[] | null,
) {
  if (!diagnostics?.length) {
    return OPERATIONAL_SYSTEMS.map((system) => ({
      key: system.name,
      name: system.name,
      desc: system.desc,
      state: system.state,
      label: STATE_LABEL[system.state],
      tooltip: STATE_TOOLTIP[system.state],
      latencyMs: undefined,
    }));
  }

  return diagnostics.map((diagnostic) => {
    const state = stateFromDiagnostic(diagnostic);

    return {
      key: diagnostic.id,
      name: diagnostic.name,
      desc: diagnostic.description,
      state,
      label: diagnostic.label,
      tooltip: diagnostic.details || STATE_TOOLTIP[state],
      latencyMs: diagnostic.latencyMs,
    };
  });
}

export function AdminOperationalStatus({
  diagnostics,
}: {
  diagnostics?: AdminIntegrationDiagnostic[] | null;
}) {
  const rows = rowsFromDiagnostics(diagnostics);

  return (
    <div className={styles.list}>
      {rows.map((s) => (
        <div key={s.key} className={styles.item}>
          <span className={`${styles.dot} ${styles[s.state]}`} />
          <div className={styles.info}>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.desc}>
              {s.desc}
              {typeof s.latencyMs === "number" ? (
                <span className={styles.latency}> · {s.latencyMs} ms</span>
              ) : null}
            </span>
          </div>
          <span className={styles.badgeWrap}>
            <span className={`${styles.badge} ${styles[s.state]}`}>
              {s.label}
            </span>
            <span className={styles.tooltip} role="tooltip">
              {s.tooltip}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
