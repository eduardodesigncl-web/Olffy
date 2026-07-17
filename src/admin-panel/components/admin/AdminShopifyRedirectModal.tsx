// @ts-nocheck
import { Modal } from "../ui";
import styles from "./AdminShopifyRedirectModal.module.css";

interface AdminShopifyRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  primaryLabel: string;
  shopifyUrl: string;
  onContinue: () => void;
}

// Modal de redirección a Shopify. Agregar producto/colección redirige a
// Shopify Admin para mantener Shopify como fuente comercial (catálogo, precios,
// stock, checkout). Aquí no se crea nada localmente.
export function AdminShopifyRedirectModal({
  isOpen,
  onClose,
  title,
  description,
  primaryLabel,
  shopifyUrl,
  onContinue,
}: AdminShopifyRedirectModalProps) {
  const handleContinue = () => {
    window.open(shopifyUrl, "_blank", "noopener,noreferrer");
    onContinue();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName={styles.modalPanel}>
      <div className={styles.wrap}>
        <div className={styles.iconBox}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9.5V20h16V9.5" />
            <path d="M3 9.5 4.5 4h15L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5z" />
          </svg>
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={handleContinue}
          >
            {primaryLabel}
          </button>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
