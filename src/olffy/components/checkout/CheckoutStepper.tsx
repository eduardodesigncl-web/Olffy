import styles from "./CheckoutStepper.module.css";

export type CheckoutStep = "review" | "shipping" | "payment" | "success";

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
}

const STEPS: { step: CheckoutStep; num: number; label: string }[] = [
  { step: "review", num: 1, label: "Carrito" },
  { step: "shipping", num: 2, label: "Envío" },
  { step: "payment", num: 3, label: "Pago" },
];

const ORDER: CheckoutStep[] = ["review", "shipping", "payment", "success"];

// Indicador de pasos del checkout (1 Carrito · 2 Envío · 3 Pago) — no se
// muestra en el paso "success" (compra ya confirmada).
export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const currentIdx = ORDER.indexOf(currentStep);

  return (
    <div className={styles.row}>
      {STEPS.map(({ step, num, label }, idx) => {
        const stepIdx = ORDER.indexOf(step);
        const isActive = step === currentStep;
        const isDone = stepIdx < currentIdx;
        return (
          <span key={step} className={styles.step}>
            <span
              className={`${styles.dot} ${isActive ? styles.dotActive : ""} ${isDone ? styles.dotDone : ""}`}
            >
              {num}
            </span>
            <span
              className={`${styles.label} ${isActive ? styles.labelActive : ""}`}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && <span className={styles.arrow}>→</span>}
          </span>
        );
      })}
    </div>
  );
}
