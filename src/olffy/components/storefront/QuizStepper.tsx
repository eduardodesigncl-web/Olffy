import styles from './QuizStepper.module.css';

interface QuizStepperProps {
  totalSteps: number;
  currentStep: number; // 1-based
}

type StepState = 'completed' | 'current' | 'upcoming';

// Flor OLFFY (6 pétalos + centro) recreada como SVG inline — sin el fondo
// cuadrado. Los pétalos toman el color del estado vía currentColor; el centro
// aloja el número del paso. Misma geometría que IconPlaceholder.
function Flower() {
  return (
    <svg className={styles.flower} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="50" cy="23" rx="17" ry="24" />
        <g transform="rotate(60 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
        <g transform="rotate(120 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
        <g transform="rotate(180 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
        <g transform="rotate(240 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
        <g transform="rotate(300 50 50)"><ellipse cx="50" cy="23" rx="17" ry="24" /></g>
      </g>
      <circle className={styles.flowerCenter} cx="50" cy="50" r="18" />
    </svg>
  );
}

// Stepper de pasos con florcitas OLFFY numeradas — reemplaza la barra de
// progreso del quiz. Estados: completed / current / upcoming.
export function QuizStepper({ totalSteps, currentStep }: QuizStepperProps) {
  return (
    <div className={styles.stepper}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const state: StepState =
          step < currentStep ? 'completed' : step === currentStep ? 'current' : 'upcoming';
        return (
          <span key={step} className={`${styles.step} ${styles[state]}`}>
            <Flower />
            <span className={styles.num}>{step}</span>
          </span>
        );
      })}
    </div>
  );
}
