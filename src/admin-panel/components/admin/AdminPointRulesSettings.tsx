import { useEffect, useState } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import styles from "./AdminPointRulesSettings.module.css";

interface AdminPointRulesSettingsProps {
  onNotice: (message: string) => void;
}

type RuleVersion = {
  id: number;
  name: string;
  spending_unit_clp: number;
  points_per_unit: number;
  point_redemption_value_clp: number;
  points_expiry_months: number;
  redemption_expiry_days: number;
  is_active: boolean;
  created_at: string;
  // Presentes después de aplicar la migración de versionado.
  valid_from?: string | null;
  created_by?: string | null;
  notes?: string | null;
};

function versionDate(version: RuleVersion): string {
  return version.valid_from ?? version.created_at;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

// Reglas de puntos versionadas: la regla vigente vive en Supabase
// (loyalty_rules). Publicar una nueva versión no recalcula movimientos
// históricos: rige solo hacia adelante.
export function AdminPointRulesSettings({
  onNotice,
}: AdminPointRulesSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<RuleVersion | null>(null);
  const [versions, setVersions] = useState<RuleVersion[]>([]);

  const [nombre, setNombre] = useState("");
  const [montoBase, setMontoBase] = useState("200");
  const [puntosBase, setPuntosBase] = useState("1");
  const [valorCanje, setValorCanje] = useState("10");
  const [expiraMeses, setExpiraMeses] = useState("6");
  const [vigenciaCanje, setVigenciaCanje] = useState("30");
  const [responsable, setResponsable] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/admin/loyalty/rules", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as {
          error?: string;
          active?: RuleVersion | null;
          versions?: RuleVersion[];
        };
        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar la regla activa");
        }
        if (cancelled) return;
        setActive(data.active ?? null);
        setVersions(data.versions ?? []);
        if (data.active) {
          setNombre(data.active.name);
          setMontoBase(String(data.active.spending_unit_clp));
          setPuntosBase(String(data.active.points_per_unit));
          setValorCanje(String(data.active.point_redemption_value_clp));
          setExpiraMeses(String(data.active.points_expiry_months));
          setVigenciaCanje(String(data.active.redemption_expiry_days));
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar la regla activa",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const monto = Math.max(1, Number(montoBase) || 0);
  const puntos = Math.max(0, Number(puntosBase) || 0);
  const ejemploMonto = 8990;
  const ejemploPuntos = Math.floor(ejemploMonto / monto) * puntos;

  const handlePublish = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/loyalty/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: nombre,
          spendingUnitClp: Number(montoBase),
          pointsPerUnit: Number(puntosBase),
          pointRedemptionValueClp: Number(valorCanje),
          pointsExpiryMonths: Number(expiraMeses),
          redemptionExpiryDays: Number(vigenciaCanje),
          createdBy: responsable,
          notes: notas,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        active?: RuleVersion | null;
        versions?: RuleVersion[];
      };
      if (!response.ok) {
        throw new Error(data.error || "No se pudo publicar la regla");
      }
      setActive(data.active ?? null);
      setVersions(data.versions ?? []);
      setNotas("");
      onNotice(
        "Nueva versión publicada. Rige solo para compras posteriores; los movimientos históricos no cambian.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo publicar la regla",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSettingsSection
      title="Reglas de puntos"
      description="Regla vigente del programa, versionada y auditada en Supabase."
      footer={
        <button
          type="button"
          className={sectionStyles.saveBtn}
          onClick={() => void handlePublish()}
          disabled={
            saving ||
            loading ||
            !nombre.trim() ||
            !responsable.trim() ||
            Number(montoBase) <= 0 ||
            Number(puntosBase) <= 0
          }
        >
          {saving ? "Publicando..." : "Publicar nueva versión"}
        </button>
      }
    >
      {loading ? (
        <p className={styles.stateText}>Cargando regla activa…</p>
      ) : null}
      {error ? (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}

      {active ? (
        <div className={styles.preview}>
          <div className={styles.previewRule}>
            Regla vigente: {fmt(active.spending_unit_clp)} ={" "}
            {active.points_per_unit}{" "}
            {active.points_per_unit === 1 ? "punto" : "puntos"} · vence a los{" "}
            {active.points_expiry_months} meses
          </div>
          <div className={styles.previewExample}>
            Vigente desde {dateLabel(versionDate(active))}
            {active.created_by ? ` · publicada por ${active.created_by}` : ""}
          </div>
        </div>
      ) : null}

      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Nombre de la versión</span>
          <input
            className={sectionStyles.input}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Responsable</span>
          <input
            className={sectionStyles.input}
            type="text"
            placeholder="Quién publica este cambio"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
          />
        </label>
      </div>

      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Monto base (CLP)</span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={montoBase}
            onChange={(e) => setMontoBase(e.target.value)}
          />
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Puntos por monto base</span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={puntosBase}
            onChange={(e) => setPuntosBase(e.target.value)}
          />
        </label>
      </div>

      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>
            Descuento por punto canjeado (CLP)
          </span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={valorCanje}
            onChange={(e) => setValorCanje(e.target.value)}
          />
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>
            Expiración de puntos (meses)
          </span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={expiraMeses}
            onChange={(e) => setExpiraMeses(e.target.value)}
          />
        </label>
      </div>

      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Vigencia de canjes (días)</span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={vigenciaCanje}
            onChange={(e) => setVigenciaCanje(e.target.value)}
          />
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Notas del cambio</span>
          <input
            className={sectionStyles.input}
            type="text"
            placeholder="Motivo o contexto (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </label>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewRule}>
          Nueva versión: {fmt(monto)} = {puntos}{" "}
          {puntos === 1 ? "punto" : "puntos"}
        </div>
        <div className={styles.previewExample}>
          Ejemplo: una compra de {fmt(ejemploMonto)} entregaría {ejemploPuntos}{" "}
          puntos
        </div>
        <div className={styles.previewExample}>
          ⚠ La nueva versión aplica solo a compras posteriores a su
          publicación. Los saldos y movimientos históricos no se recalculan.
        </div>
      </div>

      {versions.length > 0 ? (
        <div className={styles.history}>
          <span className={sectionStyles.label}>Historial de versiones</span>
          <ul className={styles.historyList}>
            {versions.map((version) => (
              <li key={version.id} className={styles.historyItem}>
                <span>
                  {version.is_active ? "● " : ""}
                  {version.name} — {fmt(version.spending_unit_clp)} ={" "}
                  {version.points_per_unit} pts
                </span>
                <span className={styles.historyMeta}>
                  {dateLabel(versionDate(version))}
                  {version.created_by ? ` · ${version.created_by}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </AdminSettingsSection>
  );
}
