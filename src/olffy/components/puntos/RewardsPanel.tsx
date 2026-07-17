import { useState } from 'react';
import { GiftIcon } from '../storefront';
import styles from './RewardsPanel.module.css';

export interface RewardTier {
  id: number;
  puntos: number;
  label: string;
  desc: string;
}

interface RewardsPanelProps {
  rewards: RewardTier[];
  saldo: number;
  /**
   * Crea la solicitud de canje. Puede ser asíncrona (backend real): si
   * devuelve { ok: false }, la card muestra el error y permite reintentar.
   */
  onRedeem?: (
    reward: RewardTier,
  ) => void | Promise<{ ok: boolean; error?: string } | void>;
}

// Recompensas disponibles. Botón "Solicitar canje" con paso de confirmación;
// al confirmar se notifica al padre (crea la solicitud real en Mis canjes y
// descuenta el saldo). Bloqueadas si faltan puntos.
export function RewardsPanel({ rewards, saldo, onRedeem }: RewardsPanelProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [errorById, setErrorById] = useState<Record<number, string>>({});
  const [requested, setRequested] = useState<Set<number>>(new Set());

  const handleConfirm = async (reward: RewardTier) => {
    setConfirmingId(null);
    setErrorById((prev) => ({ ...prev, [reward.id]: '' }));

    if (!onRedeem) {
      setRequested((prev) => new Set(prev).add(reward.id));
      return;
    }

    setPendingId(reward.id);
    try {
      const result = await onRedeem(reward);
      if (result && result.ok === false) {
        setErrorById((prev) => ({
          ...prev,
          [reward.id]: result.error || 'No se pudo solicitar el canje.',
        }));
        return;
      }
      setRequested((prev) => new Set(prev).add(reward.id));
    } catch {
      setErrorById((prev) => ({
        ...prev,
        [reward.id]: 'No se pudo solicitar el canje.',
      }));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className={styles.grid}>
      {rewards.map((reward) => {
        const available = saldo >= reward.puntos;
        const isRequested = requested.has(reward.id);
        const isConfirming = confirmingId === reward.id;
        const progressPct = Math.min(100, Math.round((saldo / reward.puntos) * 100));

        return (
          <div key={reward.id} className={`${styles.card} ${available || isRequested ? '' : styles.cardLocked}`}>
            <span className={styles.iconBox}>
              <GiftIcon name="tag" size={22} />
            </span>
            <div className={styles.pts}>{reward.puntos} pts</div>
            <div className={styles.label}>{reward.label}</div>
            <div className={styles.desc}>{reward.desc}</div>

            {/* Progreso hacia la recompensa (solo si aún no alcanza). */}
            {!available && !isRequested && (
              <div className={styles.progressWrap}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                </div>
                <span className={styles.progressText}>
                  {saldo} / {reward.puntos} pts
                </span>
              </div>
            )}

            <div className={styles.action}>
              {isRequested ? (
                <div className={styles.requested} role="status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12.5l5 5 11-11" />
                  </svg>
                  Canje solicitado. Revísalo en Mis canjes.
                </div>
              ) : isConfirming ? (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmText}>
                    ¿Quieres solicitar este canje? Se descontarán {reward.puntos} pts de tu saldo.
                  </p>
                  <div className={styles.confirmActions}>
                    <button type="button" className={styles.confirmBtn} onClick={() => void handleConfirm(reward)}>
                      Confirmar canje
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={() => setConfirmingId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : pendingId === reward.id ? (
                <button type="button" className={styles.requestBtn} disabled>
                  Solicitando…
                </button>
              ) : available ? (
                <button type="button" className={styles.requestBtn} onClick={() => setConfirmingId(reward.id)}>
                  Solicitar canje
                </button>
              ) : (
                <button type="button" className={styles.lockedBtn} disabled>
                  Te faltan {reward.puntos - saldo} pts
                </button>
              )}
              {errorById[reward.id] ? (
                <p className={styles.confirmText} role="alert">
                  {errorById[reward.id]}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
