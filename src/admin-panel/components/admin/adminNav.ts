import type { AdminTab } from "./AdminSidebar";
import type { ProductFilter } from "./AdminProductFilterCards";

// Contexto de navegación interna del admin: permite que una sección abra otra
// con un filtro/entidad ya aplicado (ej. desde el Dashboard). Todo local/mock.
export interface AdminNavContext {
  productFilter?: ProductFilter;
  productId?: number;
  customersFilter?: "activos" | "canjes";
  pointsView?: "historial";
  rewardsFilter?: "pendientes";
}

export type AdminNavigate = (tab: AdminTab, ctx?: AdminNavContext) => void;
