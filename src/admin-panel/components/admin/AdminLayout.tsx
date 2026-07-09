// @ts-nocheck
import type { ReactNode } from "react";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExit: () => void;
  children: ReactNode;
}

// Shell del panel admin: sidebar fija (morada) + área de contenido scrollable
// sobre fondo crema. Layout propio, separado del storefront público.
export function AdminLayout({
  activeTab,
  onTabChange,
  onExit,
  children,
}: AdminLayoutProps) {
  return (
    <div className={styles.layout}>
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onExit={onExit}
      />
      <div className={styles.content}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}
