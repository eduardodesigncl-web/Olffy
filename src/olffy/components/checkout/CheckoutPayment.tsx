import { Button } from "../ui";
import styles from "./CheckoutPayment.module.css";

interface CheckoutPaymentProps {
  formattedTotal: string;
  paying: boolean;
  error: string | null;
  pointsEstimate: {
    points: number;
    eligibleTotal: number;
    excludedTotal: number;
    rule: { spendingUnitClp: number; pointsPerUnit: number };
  } | null;
  onFinish: () => void;
  onBack: () => void;
}

// Paso 3 del checkout — resumen del total y redirección a la pasarela de
// pago real (TUU / checkout de Shopify), donde se eligen tarjeta, Webpay,
// transferencia, etc.
export function CheckoutPayment({
  formattedTotal,
  paying,
  error,
  pointsEstimate,
  onFinish,
  onBack,
}: CheckoutPaymentProps) {
  return (
    <div>
      <div className={styles.methods}>
        <div className={styles.method}>
          <span className={styles.methodIcon}>🔒</span>
          <span className={styles.methodInfo}>
            <span className={styles.methodTitle}>Pago seguro</span>
            <span className={styles.methodDesc}>
              Al finalizar serás redirigido a la pasarela de pago segura, donde
              puedes pagar con tarjeta de crédito, débito o Webpay.
            </span>
          </span>
        </div>
      </div>

      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Total a pagar</span>
        <span className={styles.summaryValue}>{formattedTotal}</span>
      </div>

      {pointsEstimate ? (
        <p style={{ marginTop: 12, lineHeight: 1.5 }}>
          Estimación OLFFY Puntos: <strong>{pointsEstimate.points} pts</strong>
          {` · monto elegible $${pointsEstimate.eligibleTotal.toLocaleString("es-CL")}`}
          {pointsEstimate.excludedTotal > 0
            ? ` · excluido $${pointsEstimate.excludedTotal.toLocaleString("es-CL")}`
            : ""}
          {` · ${pointsEstimate.rule.pointsPerUnit} punto(s) cada $${pointsEstimate.rule.spendingUnitClp.toLocaleString("es-CL")}. `}
          La acreditación definitiva ocurre únicamente al confirmarse el pago.
        </p>
      ) : null}

      {error && (
        <p
          role="alert"
          style={{ color: "var(--olffy-naranjo)", marginTop: 12 }}
        >
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onBack} disabled={paying}>
          ← Volver al envío
        </Button>
        <Button
          variant="primary"
          className={styles.finishBtn}
          onClick={onFinish}
          disabled={paying}
        >
          {paying ? "Redirigiendo…" : "Pagar ahora →"}
        </Button>
      </div>
    </div>
  );
}
