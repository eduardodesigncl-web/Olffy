// @ts-nocheck
import styles from "./AdminOperationalStatus.module.css";

// Estado operativo (mock). Refleja que las integraciones aún no están conectadas;
// el estado real vendrá de cada servicio en producción.
export type SystemState = "pendiente" | "mock" | "requiere";

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
  pendiente: "Pendiente",
  mock: "Mock",
  requiere: "Requiere conexión",
};

// Texto del tooltip visual por estado.
const STATE_TOOLTIP: Record<SystemState, string> = {
  pendiente: "Pendiente de conexión real. Actualmente no está integrado.",
  mock: "Funciona solo en modo demo. No envía ni recibe datos reales.",
  requiere:
    "Necesita credenciales o configuración antes de operar en producción.",
};

// Lista presentacional de estado operativo (filas + tooltips). El shell/popover
// lo aporta AdminOperationalStatusFloating.
export function AdminOperationalStatus() {
  return (
    <div className={styles.list}>
      {OPERATIONAL_SYSTEMS.map((s) => (
        <div key={s.name} className={styles.item}>
          <span className={`${styles.dot} ${styles[s.state]}`} />
          <div className={styles.info}>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.desc}>{s.desc}</span>
          </div>
          <span className={styles.badgeWrap}>
            <span className={`${styles.badge} ${styles[s.state]}`}>
              {STATE_LABEL[s.state]}
            </span>
            <span className={styles.tooltip} role="tooltip">
              {STATE_TOOLTIP[s.state]}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
