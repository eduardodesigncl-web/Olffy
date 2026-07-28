import type { AdminTab } from "./AdminSidebar";
import type { ProductFilter } from "./AdminProductFilterCards";

// Contexto de navegación interna del admin: permite que una sección abra otra
// con un filtro/entidad ya aplicado (ej. desde el Dashboard). Todo local/mock.
export interface AdminNavContext {
  productFilter?: ProductFilter;
  productId?: number;
  customersFilter?: "activos" | "canjes";
  customerId?: number;
  customerSearch?: string;
  customerScrollY?: number;
  saleId?: string;
  supportConversationId?: string;
  supportArchived?: boolean;
  returnToCustomer?: {
    customerId: number;
    filter?: "activos" | "canjes";
    search?: string;
    scrollY?: number;
  };
  pointsView?: "historial";
  rewardsFilter?: "pendientes";
}

export type AdminNavigate = (tab: AdminTab, ctx?: AdminNavContext) => void;
