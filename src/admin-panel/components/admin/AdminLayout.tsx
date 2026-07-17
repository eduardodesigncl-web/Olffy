// @ts-nocheck
import { useEffect, useState, type ReactNode } from "react";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";
import { AdminSupportInbox } from "./AdminSupportInbox";
import styles from "./AdminLayout.module.css";

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExit: () => void;
  children: ReactNode;
  allowedTabs: AdminTab[];
}

// Shell del panel admin: sidebar fija (morada) + área de contenido scrollable
// sobre fondo crema. Layout propio, separado del storefront público.
export function AdminLayout({
  activeTab,
  onTabChange,
  onExit,
  children,
  allowedTabs,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(
      window.localStorage.getItem("olffy-admin-sidebar-collapsed") === "true",
    );
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "olffy-admin-sidebar-collapsed",
        String(next),
      );
      return next;
    });
  };

  return (
    <div
      className={`${styles.layout} ${sidebarCollapsed ? styles.layoutCollapsed : ""}`}
    >
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onExit={onExit}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        allowedTabs={allowedTabs}
      />
      <div className={styles.content}>
        <div
          className={`${styles.inner} ${activeTab === "pos" ? styles.innerWide : ""}`}
        >
          {children}
        </div>
      </div>
      {allowedTabs.includes("clientes") && <AdminSupportInbox />}
    </div>
  );
}
