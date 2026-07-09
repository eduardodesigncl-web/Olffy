import type {
  AdminCanje,
  AdminColeccionRow,
  AdminHistorialItem,
  AdminProductoRow,
} from "../data/adminData.mock";
import type { DigitalSale } from "../data/adminDigitalSales.mock";
import type { AdminMetric, Product } from "../types";

export type AdminPanelCustomer = {
  idx: number;
  nombre: string;
  email: string;
  tel: string;
  puntos: number;
  estado: string;
};

export type AdminPanelData = {
  adminData: {
    clientes: AdminPanelCustomer[];
    canjesPendientes: AdminCanje[];
    historialCliente: AdminHistorialItem[];
    productos: AdminProductoRow[];
    colecciones: AdminColeccionRow[];
  };
  dashboardMetrics: AdminMetric[];
  products: Array<
    Product & {
      handle?: string;
      shopifyId?: string;
      variantId?: string;
      status?: string;
      stock?: number;
    }
  >;
  digitalSales: DigitalSale[];
  physicalSalesHistory: Array<{
    id: number;
    folio: string;
    total: string;
    pts: string;
    cliente: string;
    responsable: string;
  }>;
  pointMovements: Array<{
    id: number;
    tipo: string;
    cliente: string;
    fecha: string;
    puntos: number;
    origen: "Shopify" | "TUU" | "Canje" | "Admin";
    estado: "Aprobado" | "Pendiente" | "Reversado";
  }>;
  rewards: Array<{
    id: number;
    nombre: string;
    puntos: number;
    estado: "Activa" | "Pausada";
    descripcion: string;
  }>;
  shopifyAdminUrl: string;
};
