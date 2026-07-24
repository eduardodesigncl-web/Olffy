"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelClassName?: string;
  children: ReactNode;
}

// Modal base — usado por modales del storefront/admin (Instagram, previews).
// `panelClassName` permite ajustar el ancho del panel (ej. modales del admin)
// vía la variable CSS --modal-panel-width, sin afectar otros usos.
//
// Se renderiza mediante un portal a `document.body` para escapar de cualquier
// ancestro que cree un containing block (p. ej. wrappers con `transform` o
// `will-change`), lo que rompería el `position: fixed` del overlay y haría que
// el modal se solape con la sección en lugar de cubrir la ventana.
export function Modal({
  isOpen,
  onClose,
  panelClassName,
  children,
}: ModalProps) {
  // Bloquea el scroll del fondo mientras el modal está abierto y cierra con Esc.
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const panelClasses = [styles.panel, panelClassName].filter(Boolean).join(" ");

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={panelClasses}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
