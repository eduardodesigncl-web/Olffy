import { Button } from "../ui";
import type { AppliedCheckoutReward, CheckoutLoyaltyData } from "../../types";
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
  loyalty: CheckoutLoyaltyData;
  applyingRewardId: number | null;
  appliedReward: AppliedCheckoutReward | null;
  rewardError: string | null;
  onApplyReward: (rewardId: number) => void;
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
  loyalty,
  applyingRewardId,
  appliedReward,
  rewardError,
  onApplyReward,
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

      <section className={styles.loyalty} aria-labelledby="checkout-loyalty">
        <div className={styles.loyaltyHeader}>
          <div>
            <span className={styles.loyaltyEyebrow}>OLFFY PUNTOS</span>
            <h2 id="checkout-loyalty">Usa tus puntos en esta compra</h2>
          </div>
          {loyalty.signedIn ? (
            <strong>{loyalty.pointsBalance.toLocaleString("es-CL")} pts</strong>
          ) : null}
        </div>

        {!loyalty.signedIn ? (
          <p className={styles.loyaltyEmpty}>
            <a href="/cuenta/login">Inicia sesión</a> antes de pagar para ver tu
            saldo y canjear una recompensa.
          </p>
        ) : appliedReward ? (
          <div className={styles.appliedReward} role="status">
            <strong>✓ {appliedReward.name} aplicada</strong>
            <span>
              Código {appliedReward.code} · − $
              {appliedReward.discountAmountClp.toLocaleString("es-CL")}
            </span>
          </div>
        ) : loyalty.rewards.length > 0 ? (
          <div className={styles.rewardList}>
            {loyalty.rewards.map((reward) => {
              const enoughPoints = loyalty.pointsBalance >= reward.pointsCost;
              const estimatedTotal = pointsEstimate
                ? pointsEstimate.eligibleTotal + pointsEstimate.excludedTotal
                : 0;
              const minimumMet =
                !pointsEstimate || estimatedTotal >= reward.minimumPurchaseClp;
              const disabled =
                !enoughPoints || !minimumMet || applyingRewardId !== null;

              return (
                <div key={reward.id} className={styles.reward}>
                  <span>
                    <strong>{reward.name}</strong>
                    <small>
                      Descuento $
                      {reward.discountAmountClp.toLocaleString("es-CL")}
                      {reward.minimumPurchaseClp > 0
                        ? ` · compra mínima $${reward.minimumPurchaseClp.toLocaleString("es-CL")}`
                        : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onApplyReward(reward.id)}
                  >
                    {applyingRewardId === reward.id
                      ? "Aplicando…"
                      : enoughPoints
                        ? minimumMet
                          ? `Canjear ${reward.pointsCost.toLocaleString("es-CL")} pts`
                          : "No cumple mínimo"
                        : `Faltan ${(reward.pointsCost - loyalty.pointsBalance).toLocaleString("es-CL")} pts`}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.loyaltyEmpty}>
            No hay recompensas de descuento activas en este momento.
          </p>
        )}

        {rewardError ? (
          <p className={styles.rewardError} role="alert">
            {rewardError}
          </p>
        ) : null}
      </section>

      <div className={styles.summary}>
        <span className={styles.summaryLabel}>Total a pagar</span>
        <span className={styles.summaryValue}>
          {appliedReward
            ? `$${appliedReward.total.toLocaleString("es-CL")}`
            : formattedTotal}
        </span>
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
