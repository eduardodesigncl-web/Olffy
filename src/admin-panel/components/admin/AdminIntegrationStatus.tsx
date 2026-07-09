// @ts-nocheck
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import styles from "./AdminIntegrationStatus.module.css";

interface AdminIntegrationStatusProps {
  onNotice: (message: string) => void;
}

type IntegrationStatus = "pendiente" | "mock" | "requiere";

const STATUS_META: Record<IntegrationStatus, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: sectionStyles.pendiente },
  mock: { label: "Mock", cls: sectionStyles.mock },
  requiere: { label: "Requiere conexión", cls: sectionStyles.requiere },
};

const INTEGRATIONS: {
  name: string;
  status: IntegrationStatus;
  desc: string;
}[] = [
  {
    name: "Shopify",
    status: "requiere",
    desc: "Catálogo, precios, stock y checkout.",
  },
  {
    name: "Supabase",
    status: "requiere",
    desc: "Base de datos, puntos y auditoría.",
  },
  {
    name: "TUU",
    status: "pendiente",
    desc: "Pago presencial en tienda física.",
  },
  { name: "Email marketing", status: "mock", desc: "Campañas y newsletter." },
  {
    name: "Google Analytics / SEO",
    status: "pendiente",
    desc: "Métricas de tráfico y posicionamiento.",
  },
];

// Estado de integraciones (mock). Los botones no conectan nada real.
export function AdminIntegrationStatus({
  onNotice,
}: AdminIntegrationStatusProps) {
  return (
    <AdminSettingsSection
      title="Integraciones"
      description="Servicios externos que se conectarán en producción."
    >
      <div className={styles.list}>
        {INTEGRATIONS.map((it) => {
          const meta = STATUS_META[it.status];
          return (
            <div key={it.name} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.name}>{it.name}</span>
                <div className={styles.desc}>{it.desc}</div>
              </div>
              <div className={styles.badgeCol}>
                <span className={`${sectionStyles.badge} ${meta.cls}`}>
                  <span className={sectionStyles.badgeDot} />
                  {meta.label}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={sectionStyles.smallBtn}
                  onClick={() =>
                    onNotice(
                      "Prueba simulada. La integración real se configurará en producción.",
                    )
                  }
                >
                  Probar conexión
                </button>
                <button
                  type="button"
                  className={sectionStyles.smallBtn}
                  onClick={() =>
                    onNotice(
                      "Configuración disponible cuando se conecten credenciales reales.",
                    )
                  }
                >
                  Configurar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminSettingsSection>
  );
}
