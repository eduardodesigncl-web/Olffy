import type { AdminIntegrationDiagnostic } from "lib/admin/diagnostics-types";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import { useAdminDiagnostics } from "./useAdminDiagnostics";
import styles from "./AdminIntegrationStatus.module.css";

interface AdminIntegrationStatusProps {
  onNotice: (message: string) => void;
}

type IntegrationStatus =
  | "conectado"
  | "degradado"
  | "pendiente"
  | "mock"
  | "requiere"
  | "error";

const STATUS_META: Record<IntegrationStatus, { label: string; cls: string }> = {
  conectado: { label: "Conectado", cls: sectionStyles.conectado! },
  degradado: { label: "Revisar", cls: sectionStyles.degradado! },
  pendiente: { label: "Pendiente", cls: sectionStyles.pendiente! },
  mock: { label: "Mock", cls: sectionStyles.mock! },
  requiere: { label: "Requiere conexión", cls: sectionStyles.requiere! },
  error: { label: "Error", cls: sectionStyles.errorBadge! },
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

function statusFromDiagnostic(
  diagnostic: AdminIntegrationDiagnostic,
): IntegrationStatus {
  if (diagnostic.status === "connected") return "conectado";
  if (diagnostic.status === "degraded") return "degradado";
  if (diagnostic.status === "pending") return "pendiente";
  if (diagnostic.status === "mock") return "mock";
  if (diagnostic.status === "missing") return "requiere";
  return "error";
}

function formatDiagnosticDesc(diagnostic: AdminIntegrationDiagnostic) {
  return `${diagnostic.details} · ${diagnostic.latencyMs} ms`;
}

export function AdminIntegrationStatus({
  onNotice,
}: AdminIntegrationStatusProps) {
  const { diagnostics, loading, error, refresh } = useAdminDiagnostics(true);
  const diagnosticRows =
    diagnostics?.map((diagnostic) => ({
      name: diagnostic.name === "Email" ? "Email marketing" : diagnostic.name,
      status: statusFromDiagnostic(diagnostic),
      desc: formatDiagnosticDesc(diagnostic),
      diagnostic,
    })) ?? [];
  const rows = diagnostics
    ? [
        ...diagnosticRows,
        {
          name: "Google Analytics / SEO",
          status: "pendiente" as const,
          desc: "Métricas de tráfico y posicionamiento pendientes de configurar.",
          diagnostic: null,
        },
      ]
    : INTEGRATIONS.map((integration) => ({
        ...integration,
        diagnostic: null,
      }));

  return (
    <AdminSettingsSection
      title="Integraciones"
      description={
        error
          ? error
          : loading
            ? "Ejecutando diagnóstico real de servicios externos."
            : "Estado real de las APIs y servicios externos del sistema."
      }
      headerAction={
        <button
          type="button"
          className={sectionStyles.smallBtn}
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? "Probando..." : "Actualizar"}
        </button>
      }
    >
      <div className={styles.list}>
        {rows.map((it) => {
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
                  onClick={() => {
                    if (it.diagnostic) {
                      onNotice(`${it.name}: ${it.diagnostic.details}`);
                    } else {
                      onNotice(`${it.name}: ${it.desc}`);
                    }
                  }}
                >
                  Ver diagnóstico
                </button>
                <button
                  type="button"
                  className={sectionStyles.smallBtn}
                  onClick={() =>
                    onNotice(
                      "Revisa las variables de entorno en Vercel o en .env.local para esta integración.",
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
