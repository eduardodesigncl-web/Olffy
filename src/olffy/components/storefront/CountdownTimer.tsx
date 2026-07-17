import { useEffect, useState } from 'react';
import styles from './CountdownTimer.module.css';

interface CountdownTimerProps {
  eyebrow: string;
  title: string;
  targetDate: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getTimeLeft(targetDate: number) {
  const diff = Math.max(0, targetDate - Date.now());
  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
    secs: pad(Math.floor((diff % 60000) / 1000)),
  };
}

// Contador regresivo mock hacia una fecha futura — se actualiza cada segundo
// vía setInterval, igual que countdownTarget/countdownTick del original.
export function CountdownTimer({ eyebrow, title, targetDate }: CountdownTimerProps) {
  // La hora no se puede leer durante el prerender: parte con placeholder
  // estático y se calcula al hidratar (luego cada segundo).
  const [timeLeft, setTimeLeft] = useState({
    days: '--',
    hours: '--',
    mins: '--',
    secs: '--',
  });

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className={styles.wrap}>
      <div className={styles.textCol}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.units}>
        <div className={styles.unit}>
          <div className={styles.unitValue}>{timeLeft.days}</div>
          <div className={styles.unitLabel}>Días</div>
        </div>
        <div className={styles.unit}>
          <div className={styles.unitValue}>{timeLeft.hours}</div>
          <div className={styles.unitLabel}>Horas</div>
        </div>
        <div className={styles.unit}>
          <div className={styles.unitValue}>{timeLeft.mins}</div>
          <div className={styles.unitLabel}>Min</div>
        </div>
        <div className={styles.unit}>
          <div className={styles.unitValue}>{timeLeft.secs}</div>
          <div className={styles.unitLabel}>Seg</div>
        </div>
      </div>
    </div>
  );
}
