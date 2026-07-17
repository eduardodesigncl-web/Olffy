// @ts-nocheck
import styles from "./AdminSidebar.module.css";

export type AdminTab =
  | "dashboard"
  | "clientes"
  | "soporte"
  | "ventas"
  | "pos"
  | "puntos"
  | "recompensas"
  | "productos"
  | "colecciones"
  | "ajustes";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExit: () => void;
  collapsed: boolean;
  onToggle: () => void;
  allowedTabs: AdminTab[];
}

const NAV: { id: AdminTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ventas", label: "Ventas" },
  { id: "pos", label: "Tienda POS" },
  { id: "clientes", label: "Clientes" },
  { id: "soporte", label: "Centro de soporte" },
  { id: "puntos", label: "Puntos" },
  { id: "recompensas", label: "Recompensas" },
  { id: "productos", label: "Productos" },
  { id: "colecciones", label: "Colecciones" },
  { id: "ajustes", label: "Ajustes" },
];

// Íconos SVG line-art propios del admin (no dependemos del set de storefront).
function AdminIcon({ tab }: { tab: AdminTab }) {
  const c = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (tab) {
    case "dashboard":
      return (
        <svg {...c}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "clientes":
      return (
        <svg {...c}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "soporte":
      return (
        <svg {...c}>
          <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
          <path d="M4 13H2v5h4v-7H4M20 13h2v5h-4v-7h2" />
          <path d="M18 19c0 1.1-.9 2-2 2h-3" />
          <circle cx="11" cy="21" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "ventas":
      return (
        <svg {...c}>
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M2 9h20M6 14h6" />
        </svg>
      );
    case "pos":
      return (
        <svg {...c}>
          <path d="M4 9.5V20h16V9.5" />
          <path d="M3 9.5 4.5 4h15L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5z" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "puntos":
      return (
        <svg {...c}>
          <path d="M12 2.5l3.09 6.26L22 9.77l-5 4.87 1.18 6.86L12 18.27l-6.18 3.23L7 14.64l-5-4.87 6.91-1.01L12 2.5z" />
        </svg>
      );
    case "recompensas":
      return (
        <svg {...c}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 8H8.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8zM12 8h3.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8z" />
        </svg>
      );
    case "productos":
      return (
        <svg {...c}>
          <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7z" />
          <path d="M3 8.5 12 14l9-5.5M12 14v7" />
        </svg>
      );
    case "colecciones":
      return (
        <svg {...c}>
          <path d="M12 3 2.5 8 12 13l9.5-5L12 3z" />
          <path d="m2.5 12 9.5 5 9.5-5M2.5 16 12 21l9.5-5" />
        </svg>
      );
    case "ajustes":
      return (
        <svg {...c}>
          <path d="M10.33 4.32c.43-1.76 2.92-1.76 3.35 0a1.72 1.72 0 0 0 2.57 1.06c1.54-.94 3.31.83 2.37 2.37a1.72 1.72 0 0 0 1.06 2.57c1.76.43 1.76 2.92 0 3.35a1.72 1.72 0 0 0-1.06 2.57c.94 1.54-.83 3.31-2.37 2.37a1.72 1.72 0 0 0-2.57 1.06c-.43 1.76-2.92 1.76-3.35 0a1.72 1.72 0 0 0-2.57-1.06c-1.54.94-3.31-.83-2.37-2.37a1.72 1.72 0 0 0-1.06-2.57c-1.76-.43-1.76-2.92 0-3.35a1.72 1.72 0 0 0 1.06-2.57c-.94-1.54.83-3.31 2.37-2.37a1.72 1.72 0 0 0 2.57-1.06z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
}

// Navegación lateral del panel admin. El estado (activeTab) vive en AdminPage.
export function AdminSidebar({
  activeTab,
  onTabChange,
  onExit,
  collapsed,
  onToggle,
  allowedTabs,
}: AdminSidebarProps) {
  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      <div className={styles.brand}>
        <span className={styles.logo}>OLFFY®</span>
        <span className={styles.logoCompact}>O</span>
        <span className={styles.badge}>Admin</span>
      </div>

      <button
        type="button"
        className={styles.collapseButton}
        onClick={onToggle}
        aria-label={
          collapsed ? "Expandir barra lateral" : "Guardar barra lateral"
        }
        title={collapsed ? "Expandir barra" : "Guardar barra"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
        </svg>
      </button>

      <nav className={styles.nav}>
        {NAV.filter((item) => allowedTabs.includes(item.id)).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.item} ${activeTab === item.id ? styles.itemActive : ""}`}
            onClick={() => onTabChange(item.id)}
            aria-current={activeTab === item.id ? "page" : undefined}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.itemIcon}>
              <AdminIcon tab={item.id} />
            </span>
            <span className={styles.itemLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className={styles.exit}
        onClick={onExit}
        aria-label="Salir al sitio"
        title={collapsed ? "Salir al sitio" : undefined}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span className={styles.itemLabel}>Salir al sitio</span>
      </button>
    </aside>
  );
}
