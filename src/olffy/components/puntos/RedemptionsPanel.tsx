import { useState } from 'react';
import { GiftIcon } from '../storefront';
import styles from './RedemptionsPanel.module.css';

export type RedemptionStatus = 'Solicitado' | 'Aprobado' | 'Usado' | 'Cancelado';

export interface Redemption {
  id: number;
  recompensa: string;
  fecha: string;
  puntos?: number;
  estado: RedemptionStatus;
  codigo?: string;
  usadoFecha?: string;
  motivo?: string;
}

interface RedemptionsPanelProps {
  redemptions: Redemption[];
}

const STATUS_CLASS: Record<RedemptionStatus, string> = {
  Solicitado: styles.solicitado!,
  Aprobado: styles.aprobado!,
  Usado: styles.usado!,
  Cancelado: styles.cancelado!,
};

// Canjes del cliente (mock, estructura backend). El código aparece cuando el
// canje está aprobado o usado; si está aprobado se puede copiar. Sin acciones
// de aprobar/rechazar — eso es del admin.
export function RedemptionsPanel({ redemptions }: RedemptionsPanelProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyCode = (r: Redemption) => {
    if (!r.codigo) return;
    const done = () => {
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId((id) => (id === r.id ? null : id)), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(r.codigo).then(done).catch(done);
    } else {
      done();
    }
  };

  if (redemptions.length === 0) {
    return <div className={styles.empty}>Todavía no tienes canjes registrados.</div>;
  }

  return (
    <div className={styles.list}>
      {redemptions.map((r) => (
        <div key={r.id} className={styles.item}>
          <span className={styles.iconBox}>
            <GiftIcon name="gift" size={20} />
          </span>
          <div className={styles.info}>
            <div className={styles.reward}>{r.recompensa}</div>
            <div className={styles.fecha}>
              {r.fecha}
              {typeof r.puntos === 'number' && ` · ${r.puntos} pts`}
            </div>

            {r.estado === 'Solicitado' && (
              <div className={styles.hint}>Tu canje está siendo revisado.</div>
            )}
            {r.estado === 'Usado' && r.usadoFecha && (
              <div className={styles.hint}>Usado el {r.usadoFecha}.</div>
            )}
            {r.estado === 'Cancelado' && (
              <div className={styles.hint}>{r.motivo ?? 'Este canje fue cancelado.'}</div>
            )}

            {r.codigo && (
              <div className={styles.codeRow}>
                <span className={styles.codigo}>{r.codigo}</span>
                {r.estado === 'Aprobado' && (
                  <button type="button" className={styles.copyBtn} onClick={() => copyCode(r)}>
                    {copiedId === r.id ? (
                      <span className={styles.copied} role="status">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 12.5l5 5 11-11" />
                        </svg>
                        Copiado
                      </span>
                    ) : (
                      'Copiar código'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <span className={`${styles.status} ${STATUS_CLASS[r.estado]}`}>{r.estado}</span>
        </div>
      ))}
    </div>
  );
}
