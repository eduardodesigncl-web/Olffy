import type { ReactNode } from 'react';
import styles from './Drawer.module.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  panelClassName?: string;
  children: ReactNode;
}

// Panel lateral base — usado por CartDrawer y MobileMenuDrawer.
export function Drawer({ isOpen, onClose, side = 'right', panelClassName, children }: DrawerProps) {
  if (!isOpen) return null;

  const panelClasses = [styles.panel, panelClassName].filter(Boolean).join(' ');

  return (
    <div className={`${styles.overlay} ${styles[side]}`}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={panelClasses}>{children}</div>
    </div>
  );
}
