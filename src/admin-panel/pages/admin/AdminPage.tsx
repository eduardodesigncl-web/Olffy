import { useEffect, useState } from "react";
import {
  AdminLayout,
  AdminDashboard,
  AdminCustomers,
  AdminPoints,
  AdminRewards,
  AdminProducts,
  AdminCollections,
  AdminSales,
  AdminPos,
  AdminSettings,
  AdminSupportInbox,
  type AdminTab,
  type AdminNavContext,
} from "../../components/admin";

interface AdminPageProps {
  onExit: () => void;
  initialTab?: AdminTab;
  onTabRequest?: (tab: AdminTab) => void;
  allowedTabs: AdminTab[];
}

// URL persistente por pestaña: Ventas y Tienda POS tienen ruta propia; el resto
// usa ?tab= sobre /admin para poder recargar o compartir la vista activa.
function tabUrl(tab: AdminTab): string {
  if (tab === "dashboard") return "/admin";
  if (tab === "ventas") return "/admin/ventas";
  if (tab === "pos") return "/admin/pos";
  return `/admin?tab=${tab}`;
}

// Panel Admin interno de OLFFY. Los datos reales se hidratan en
// AdminPanelClient (hydrateAdminPanelData) antes del primer render.
// Navegación interna: `activeTab` + `navContext` permiten que una sección abra
// otra con un filtro/entidad ya aplicado (ej. desde el Dashboard).
export function AdminPage({
  onExit,
  initialTab = "dashboard",
  onTabRequest,
  allowedTabs,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [navContext, setNavContext] = useState<AdminNavContext | null>(null);

  useEffect(() => {
    window.history.replaceState(null, "", tabUrl(activeTab));
  }, [activeTab]);

  // Navegación con contexto (desde Dashboard u otras secciones).
  const navigate = (tab: AdminTab, ctx?: AdminNavContext) => {
    if (!allowedTabs.includes(tab)) return;
    setActiveTab(tab);
    setNavContext(ctx ?? null);
  };

  // Cambio manual desde el sidebar: limpia el contexto.
  const handleTabChange = (tab: AdminTab) => {
    if (onTabRequest) {
      onTabRequest(tab);
      return;
    }
    setActiveTab(tab);
    setNavContext(null);
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onExit={onExit}
      allowedTabs={allowedTabs}
    >
      {activeTab === "dashboard" && (
        <AdminDashboard
          onNavigate={navigate}
          canAccessSupport={allowedTabs.includes("soporte")}
        />
      )}
      {activeTab === "clientes" && <AdminCustomers navContext={navContext} />}
      {activeTab === "soporte" && <AdminSupportInbox />}
      {activeTab === "puntos" && <AdminPoints />}
      {activeTab === "recompensas" && <AdminRewards />}
      {activeTab === "productos" && <AdminProducts navContext={navContext} />}
      {activeTab === "colecciones" && <AdminCollections />}
      {activeTab === "ventas" && <AdminSales />}
      {activeTab === "pos" && <AdminPos />}
      {activeTab === "ajustes" && <AdminSettings />}
    </AdminLayout>
  );
}
