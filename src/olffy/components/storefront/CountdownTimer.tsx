import { useEffect, useState } from "react";
import styles from "./CountdownTimer.module.css";

interface CountdownTimerProps {
  eyebrow: string;
  title: string;
  durationMs: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getTimeLeftFromDiff(diffMs: number) {
  const diff = Math.max(0, diffMs);
  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
    secs: pad(Math.floor((diff % 60000) / 1000)),
  };
}

function getTimeLeft(targetDate: number) {
  return getTimeLeftFromDiff(targetDate - Date.now());
}

// Contador regresivo mock hacia una fecha futura — se actualiza cada segundo
// vía setInterval, igual que countdownTarget/countdownTick del original.
export function CountdownTimer({
  eyebrow,
  title,
  durationMs,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeftFromDiff(durationMs));

  useEffect(() => {
    const targetDate = Date.now() + durationMs;
    setTimeLeft(getTimeLeft(targetDate));
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [durationMs]);

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
