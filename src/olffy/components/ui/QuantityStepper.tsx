import styles from "./QuantityStepper.module.css";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  // Máximo permitido (stock conocido de la variante). Sin max no hay tope:
  // cuando Shopify no expone cantidad, la validación final es del servidor.
  max?: number;
}

// Control +/- reutilizado en cart line item, modal de producto y POS admin.
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
}: QuantityStepperProps) {
  const atMax = typeof max === "number" && value >= max;

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        className={`${styles.btn} ${styles.inc}`}
        onClick={() => onChange(atMax ? value : value + 1)}
        disabled={atMax}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
