import type {
  AdminCanje,
  AdminColeccionRow,
  AdminHistorialItem,
  AdminProductoRow,
} from "../data/adminData.mock";
import type { AdminMetric, Product } from "../types";

export type AdminPanelCustomer = {
  idx: number;
  nombre: string;
  email: string;
  tel: string;
  puntos: number;
  estado: string;
  createdAt: string;
};

export type UnifiedSaleOrigin = "online" | "fisica";

export type UnifiedSaleItem = {
  nombre: string;
  qty: number;
  precio: string;
};

export type UnifiedSale = {
  id: string;
  folio: string;
  cliente: string;
  email: string;
  fechaISO: string;
  fecha: string;
  total: string;
  totalN: number;
  metodoPago: string;
  estadoPago: "Pagado" | "Pendiente" | "Rechazado" | "Revisión";
  origen: UnifiedSaleOrigin;
  origenLabel: string;
  referenciaPago: string | null;
  boleta: string;
  puntos: number;
  loyaltyStatus: string;
  shopifyOrderId: string | null;
  detalleCanal: string;
  productos: UnifiedSaleItem[];
};

export type PosLoyaltyRule = {
  spendingUnitClp: number;
  pointsPerUnit: number;
  pointRedemptionValueClp: number;
};

export type PosProductVariant = {
  id: string;
  title: string;
  price: number;
  availableForSale: boolean;
  quantityAvailable?: number;
};

export type AdminPanelData = {
  posReadiness: {
    shopify: boolean;
    discounts: boolean;
    tuuRemote: boolean;
    tuuWebhook: boolean;
    shopifyWebhooks: boolean;
  };
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
      image?: string;
      images?: string[];
      variants?: PosProductVariant[];
      /** Marcado en Shopify con la categoría de exclusión de OLFFY Puntos. */
      sinPuntos?: boolean;
    }
  >;
  sales: UnifiedSale[];
  loyaltyRule: PosLoyaltyRule | null;
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
    fechaISO: string;
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
    shopifyCode?: string;
    rewardType: "discount" | "product" | "experience" | "other";
    discountAmountClp: number;
    minimumPurchaseClp: number;
    validityDays: number;
  }>;
  abandonedCheckouts: {
    available: boolean;
    source: "klaviyo" | "shopify";
    fetchedAt: string;
    count: number;
    totalAmount: number;
    checkouts: Array<{
      id: string;
      name: string;
      createdAt: string;
      totalPrice: number;
      customerEmail: string | null;
      lineItems: string[];
    }>;
    error?: string;
  };
  shopifyAdminUrl: string;
};
