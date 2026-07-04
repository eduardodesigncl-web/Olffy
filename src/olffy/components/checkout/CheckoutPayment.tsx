import { Button } from "../ui";
import styles from "./CheckoutPayment.module.css";

interface CheckoutPaymentProps {
  formattedTotal: string;
  paying: boolean;
  error: string | null;
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
