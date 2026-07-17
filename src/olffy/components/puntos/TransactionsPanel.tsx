import styles from './TransactionsPanel.module.css';

export interface Transaction {
  id: number;
  tipo: string;
  fecha: string;
  descripcion: string;
  puntos: number; // positivo (acumula) o negativo (usa)
  estado: string;
}

interface TransactionsPanelProps {
  transactions: Transaction[];
  limit?: number;
}

// Historial de movimientos de puntos (solo lectura, mock). Con `limit` muestra
// las primeras N (usado en la vista Resumen para las últimas 3).
export function TransactionsPanel({ transactions, limit }: TransactionsPanelProps) {
  const visible = typeof limit === 'number' ? transactions.slice(0, limit) : transactions;

  return (
    <div className={styles.list}>
      {visible.map((tx) => {
        const isPositive = tx.puntos >= 0;
        return (
          <div key={tx.id} className={styles.item}>
            <span className={`${styles.iconBox} ${isPositive ? '' : styles.iconBoxNeg}`}>
              {isPositive ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                </svg>
              )}
            </span>
            <div className={styles.info}>
              <div className={styles.tipo}>{tx.tipo}</div>
              <div className={styles.desc}>{tx.descripcion}</div>
            </div>
            <div className={styles.right}>
              <div className={`${styles.pts} ${isPositive ? styles.ptsPos : styles.ptsNeg}`}>
                {isPositive ? '+' : '−'}
                {Math.abs(tx.puntos)} pts
              </div>
              <div className={styles.meta}>
                {tx.fecha} · {tx.estado}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
