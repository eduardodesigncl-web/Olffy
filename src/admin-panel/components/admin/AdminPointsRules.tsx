// @ts-nocheck
import styles from "./AdminPointsRules.module.css";

const RULES = [
  "$1.000 gastados equivalen a 10 puntos.",
  "Los puntos se calculan sobre el total efectivamente pagado.",
  "Los descuentos reducen la base de acumulación.",
  "Los canjes descuentan puntos del saldo disponible.",
  "Las devoluciones generan una reversa de los puntos acumulados.",
  "Los ajustes manuales deben incluir siempre un motivo.",
  "Cada movimiento queda registrado con trazabilidad.",
];

// Reglas internas del programa de puntos (referencia operativa, mock).
export function AdminPointsRules() {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Reglas del programa</h2>
      <ol className={styles.list}>
        {RULES.map((rule, idx) => (
          <li key={rule} className={styles.item}>
            <span className={styles.num}>{idx + 1}</span>
            <span className={styles.text}>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
