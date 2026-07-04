import type { ReactNode } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Modal base — usado por ProductModal y cualquier otro modal futuro.
export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
