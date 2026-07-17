import styles from './QuantityStepper.module.css';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}

// Control +/- reutilizado en cart line item, modal de producto y POS admin.
export function QuantityStepper({ value, onChange, min = 1 }: QuantityStepperProps) {
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
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
