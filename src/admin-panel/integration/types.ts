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
  id: string;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  nombre: string;
  variante: string | null;
  sku: string | null;
  qty: number;
  precio: string;
  precioN: number;
  descuento: string;
  descuentoN: number;
  pagado: string;
  pagadoN: number;
  elegible: boolean;
};

export type UnifiedSale = {
  id: string;
  folio: string;
  cliente: string;
  email: string;
  customerId: number | null;
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
  montoElegible: string;
  montoExcluido: string;
  reglaAplicada: string;
};

export type UnifiedSaleDetail = UnifiedSale & {
  productos: UnifiedSaleItem[];
  subtotal: string;
  subtotalN: number;
  descuento: string;
  descuentoN: number;
  ajustes: string;
  ajustesN: number;
  responsable: string;
  numeroComprobante: string | null;
  notas: string | null;
};

export type AdminCustomerPurchase = Pick<
  UnifiedSale,
  | "id"
  | "folio"
  | "fecha"
  | "fechaISO"
  | "total"
  | "totalN"
  | "origen"
  | "origenLabel"
  | "estadoPago"
>;

export type AdminCustomerSupportConversation = {
  id: string;
  reference: string;
  status: "new" | "in_progress" | "waiting_information" | "resolved";
  statusLabel: string;
  lastMessage: string | null;
  lastMessageAt: string;
  lastMessageDate: string;
  archived: boolean;
};

export type AdminCustomerContext = {
  purchaseCount: number;
  purchases: AdminCustomerPurchase[];
  supportCount: number;
  supportConversations: AdminCustomerSupportConversation[];
};

export type PosLoyaltyRule = {
  id: number;
  name: string;
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
      /** Metafield booleano Shopify olffy.exclude_from_points. */
      sinPuntos?: boolean;
    }
  >;
  sales: UnifiedSale[];
  customerContexts: Record<string, AdminCustomerContext>;
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
  storeInfo: {
    name: string;
    contactEmail: string | null;
    phone: string | null;
    address: string | null;
    domain: string | null;
    currencyCode: string;
  } | null;
  shopifyAdminUrl: string;
};
