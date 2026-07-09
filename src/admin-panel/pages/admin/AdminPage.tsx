// @ts-nocheck
import { useState } from "react";
import {
  AdminLayout,
  AdminDashboard,
  AdminCustomers,
  AdminPoints,
  AdminRewards,
  AdminProducts,
  AdminCollections,
  AdminPhysicalSales,
  AdminDigitalSales,
  AdminSettings,
  type AdminTab,
  type AdminNavContext,
} from "../../components/admin";

interface AdminPageProps {
  onExit: () => void;
}

// Panel Admin interno de OLFFY — mock local, sin backend.
// Navegación interna: `activeTab` + `navContext` permiten que una sección abra
// otra con un filtro/entidad ya aplicado (ej. desde el Dashboard).
// SEGURIDAD: en producción esta zona debe ir detrás de auth real y permisos
// internos (no expuesta públicamente). Aquí no hay login admin todavía.
export function AdminPage({ onExit }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [navContext, setNavContext] = useState<AdminNavContext | null>(null);

  // Navegación con contexto (desde Dashboard u otras secciones).
  const navigate = (tab: AdminTab, ctx?: AdminNavContext) => {
    setActiveTab(tab);
    setNavContext(ctx ?? null);
  };

  // Cambio manual desde el sidebar: limpia el contexto.
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setNavContext(null);
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onExit={onExit}
    >
      {activeTab === "dashboard" && <AdminDashboard onNavigate={navigate} />}
      {activeTab === "clientes" && <AdminCustomers navContext={navContext} />}
      {activeTab === "puntos" && <AdminPoints />}
      {activeTab === "recompensas" && <AdminRewards />}
      {activeTab === "productos" && <AdminProducts navContext={navContext} />}
      {activeTab === "colecciones" && <AdminCollections />}
      {activeTab === "ventas" && <AdminPhysicalSales />}
      {activeTab === "ventas-digitales" && <AdminDigitalSales />}
      {activeTab === "ajustes" && <AdminSettings />}
    </AdminLayout>
  );
}
