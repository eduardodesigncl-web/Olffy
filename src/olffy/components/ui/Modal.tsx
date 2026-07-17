import type { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelClassName?: string;
  children: ReactNode;
}

// Modal base — usado por modales del storefront/admin (Instagram, previews).
// `panelClassName` permite ajustar el ancho del panel (ej. modales del admin)
// vía la variable CSS --modal-panel-width, sin afectar otros usos.
export function Modal({ isOpen, onClose, panelClassName, children }: ModalProps) {
  if (!isOpen) return null;

  const panelClasses = [styles.panel, panelClassName].filter(Boolean).join(' ');

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={panelClasses}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
