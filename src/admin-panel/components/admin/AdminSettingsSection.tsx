// @ts-nocheck
import type { ReactNode } from "react";
import styles from "./AdminSettingsSection.module.css";

interface AdminSettingsSectionProps {
  title: string;
  description?: string;
  // Acción opcional alineada a la derecha del título (ej. "Ajustes predeterminados").
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

// Card genérica de una sección de ajustes. Reutilizada por todas las cards de
// AdminSettings; expone además primitivos de formulario/badge vía sectionStyles.
export function AdminSettingsSection({
  title,
  description,
  headerAction,
  footer,
  children,
}: AdminSettingsSectionProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h2 className={styles.title}>{title}</h2>
          {headerAction}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

// Clases utilitarias (form/badge) reutilizadas por las cards de ajustes.
export const sectionStyles = styles;
