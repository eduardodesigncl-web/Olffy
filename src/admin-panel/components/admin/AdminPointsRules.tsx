import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminPointsRules.module.css";

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Reglas operativas del programa de puntos, derivadas de la regla vigente en
// Supabase (la primera línea refleja la versión activa, no un valor fijo).
export function AdminPointsRules() {
  const rule = adminPanelRuntime.data?.loyaltyRule ?? null;
  const baseRule = rule
    ? `${fmt(rule.spendingUnitClp)} pagados equivalen a ${rule.pointsPerUnit} ${
        rule.pointsPerUnit === 1 ? "punto" : "puntos"
      }.`
    : "La regla vigente se configura en Ajustes → Reglas de puntos.";

  const rules = [
    baseRule,
    "Los puntos se calculan sobre el total efectivamente pagado, después de descuentos y sin envío.",
    "Los productos marcados como excluidos en Shopify no generan puntos.",
    "Los canjes descuentan puntos del saldo disponible.",
    "Las devoluciones generan una reversa de los puntos acumulados.",
    "Los ajustes manuales deben incluir siempre un motivo y un responsable.",
    "Cada movimiento queda registrado con la versión de regla aplicada.",
  ];

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Reglas del programa</h2>
      <ol className={styles.list}>
        {rules.map((rule, idx) => (
          <li key={rule} className={styles.item}>
            <span className={styles.num}>{idx + 1}</span>
            <span className={styles.text}>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
