// @ts-nocheck
import type { ReactNode } from "react";
import { Modal } from "../ui";
import styles from "./AdminPreviewModal.module.css";

interface AdminPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Modal genérico de preview (producto / colección) — vista demo. El contenido
// y el footer los define quien lo usa. Reexporta clases utilitarias por props.
export function AdminPreviewModal({
  isOpen,
  onClose,
  eyebrow,
  title,
  children,
  footer,
}: AdminPreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName={styles.modalPanel}>
      <div className={styles.wrap}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </Modal>
  );
}

// Clases utilitarias expuestas para que los previews compongan su contenido
// sin duplicar estilos.
export const previewStyles = styles;
