import type { Product } from "../contracts/product.types";
import type { Cart, CartLine } from "../contracts/cart.types";
import type { Customer, PointsTransaction } from "../contracts/customer.types";
import type { Reward, Redemption } from "../contracts/loyalty.types";
import type { AdminDashboard, PhysicalSale } from "../contracts/admin.types";

// ── Mock Products (from WebTiendaPage PRODUCTS + AdminPage MOCK_PRODUCTS) ──────
export const mockProducts: Product[] = [
  {
    id: "prod-001",
    handle: "agenda-semanal-2025",
    title: "Agenda Semanal 2025",
    description:
      "Agenda semanal con diseño ilustrado exclusivo de Olffy. Tapa dura, papel de 90g, marcador de página y bolsillo interior. Perfecta para organizarte con estilo todo el año.",
    price: 12990,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Agendas y planners",
    tags: ["Nuevo", "agenda"],
    availableForSale: true,
    quantityAvailable: 8,
    variantId: "var-001",
    variants: [
      {
        id: "var-001",
        title: "Default",
        price: 12990,
        availableForSale: true,
        quantityAvailable: 8,
      },
    ],
  },
  {
    id: "prod-002",
    handle: "cuaderno-ilustrado-a5",
    title: "Cuaderno Ilustrado A5",
    description:
      "Cuaderno de tapa ilustrada con diseño original, ideal para notas, bocetos y escritura creativa. Encuadernación cosida para máxima durabilidad.",
    price: 8990,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Cuadernos",
    tags: ["cuaderno"],
    availableForSale: true,
    quantityAvailable: 5,
    variantId: "var-002",
    variants: [
      {
        id: "var-002",
        title: "Default",
        price: 8990,
        availableForSale: true,
        quantityAvailable: 5,
      },
    ],
  },
  {
    id: "prod-003",
    handle: "kit-stickers-florales",
    title: "Kit de Stickers Florales",
    description:
      "Set de stickers florales con ilustraciones originales de Olffy. Diseñados para decorar agendas, cuadernos, sobres y cualquier superficie lisa.",
    price: 4990,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Stickers",
    tags: ["Favorito", "stickers"],
    availableForSale: true,
    quantityAvailable: 14,
    variantId: "var-003",
    variants: [
      {
        id: "var-003",
        title: "Default",
        price: 4990,
        availableForSale: true,
        quantityAvailable: 14,
      },
    ],
  },
  {
    id: "prod-004",
    handle: "planner-mensual",
    title: "Planner Mensual",
    description:
      "Planner mensual con vista de mes completa, espacio para metas, hábitos y reflexiones. Diseño minimalista con detalles ilustrados.",
    price: 9990,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Agendas y planners",
    tags: ["planner"],
    availableForSale: false,
    quantityAvailable: 0,
    variantId: "var-004",
    variants: [
      {
        id: "var-004",
        title: "Default",
        price: 9990,
        availableForSale: false,
        quantityAvailable: 0,
      },
    ],
  },
  {
    id: "prod-005",
    handle: "marcapaginas-set-x4",
    title: "Marcapáginas Set x4",
    description:
      "Set de 4 marcapáginas con ilustraciones originales de Olffy. Hechos en cartulina de alta gramaje con laminado mate y cinta de tela.",
    price: 3490,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Marcapáginas",
    tags: ["Nuevo", "marcapaginas"],
    availableForSale: true,
    quantityAvailable: 20,
    variantId: "var-005",
    variants: [
      {
        id: "var-005",
        title: "Default",
        price: 3490,
        availableForSale: true,
        quantityAvailable: 20,
      },
    ],
  },
  {
    id: "prod-006",
    handle: "kit-papeleria-completo",
    title: "Kit Papelería Completo",
    description:
      "Kit de papelería completo con los productos más queridos de Olffy. El regalo perfecto para quienes aman organizarse con creatividad y estilo.",
    price: 24990,
    currencyCode: "CLP",
    image: "",
    images: [],
    category: "Accesorios",
    tags: ["Nuevo", "kit", "regalo"],
    availableForSale: true,
    quantityAvailable: 3,
    variantId: "var-006",
    variants: [
      {
        id: "var-006",
        title: "Default",
        price: 24990,
        availableForSale: true,
        quantityAvailable: 3,
      },
    ],
  },
];

// ── Mock Cart ─────────────────────────────────────────────────────────────────
export const mockCartLines: CartLine[] = [
  {
    lineId: "line-001",
    productId: "prod-001",
    variantId: "var-001",
    title: "Agenda Semanal 2025",
    image: "",
    quantity: 1,
    price: 12990,
  },
  {
    lineId: "line-002",
    productId: "prod-003",
    variantId: "var-003",
    title: "Kit de Stickers Florales",
    image: "",
    quantity: 2,
    price: 4990,
  },
];

export const mockCart: Cart = {
  cartId: "cart-mock-001",
  lines: mockCartLines,
  subtotal: 22970,
  total: 26960,
  checkoutUrl: "https://olffy.myshopify.com/checkout/mock",
};

// ── Mock Customer (Milenka Burgos — from AccountPage & AdminPage) ─────────────
export const mockCustomer: Customer = {
  id: "cust-001",
  fullName: "Milenka Burgos",
  email: "miel.designer1@gmail.com",
  phone: "+56986416035",
  status: "active",
  pointsBalance: 2200,
  lifetimePointsEarned: 2500,
  lifetimePointsRedeemed: 300,
};

// ── Mock Customers (from AdminPage CLIENTE_DATA / MOCK_CLIENTES) ──────────────
export const mockCustomers: Customer[] = [
  {
    id: "cust-001",
    fullName: "Milenka Burgos",
    email: "miel.designer1@gmail.com",
    phone: "+56986416035",
    status: "active",
    pointsBalance: 2200,
    lifetimePointsEarned: 2500,
    lifetimePointsRedeemed: 300,
  },
  {
    id: "cust-002",
    fullName: "Eduardo Díaz",
    email: "eduardo.design.cl@gmail.com",
    phone: "+56 9 0000 0000",
    status: "pending",
    pointsBalance: 0,
    lifetimePointsEarned: 0,
    lifetimePointsRedeemed: 0,
  },
  {
    id: "cust-003",
    fullName: "Edu Gutiérrez",
    email: "ediv.gutierrez@gmail.com",
    phone: "+56 9 5555 1234",
    status: "active",
    pointsBalance: 420,
    lifetimePointsEarned: 720,
    lifetimePointsRedeemed: 300,
  },
];

// ── Mock Rewards (from AccountPage REWARDS) ───────────────────────────────────
export const mockRewards: Reward[] = [
  {
    id: "reward-001",
    title: "$3.000 de descuento",
    description: "Descuento directo en tu próxima compra",
    pointsCost: 300,
    discountAmount: 3000,
    minimumPurchase: 0,
    validityDays: 30,
    available: true,
  },
  {
    id: "reward-002",
    title: "$5.000 de descuento",
    description: "Descuento directo en tu próxima compra",
    pointsCost: 500,
    discountAmount: 5000,
    minimumPurchase: 0,
    validityDays: 30,
    available: true,
  },
  {
    id: "reward-003",
    title: "$10.000 de descuento",
    description: "Descuento directo en tu próxima compra",
    pointsCost: 1000,
    discountAmount: 10000,
    minimumPurchase: 0,
    validityDays: 30,
    available: true,
  },
];

// ── Mock Redemptions ──────────────────────────────────────────────────────────
export const mockRedemptions: Redemption[] = [
  {
    id: "redemp-001",
    customerId: "cust-001",
    rewardId: "reward-001",
    rewardTitle: "$3.000 de descuento",
    pointsCost: 300,
    status: "requested",
    requestedAt: "2026-06-27T13:24:00.000Z",
  },
];

// ── Mock Transactions (from AdminPage history in Clientes) ────────────────────
export const mockTransactions: PointsTransaction[] = [
  {
    id: "tx-001",
    type: "earned",
    points: 420,
    balanceAfter: 420,
    description: "Compra online Shopify",
    source: "shopify_order",
    date: "2026-06-12",
  },
  {
    id: "tx-002",
    type: "redeemed",
    points: -300,
    balanceAfter: 120,
    description: "Canje aprobado: $3.000 de descuento",
    source: "redemption",
    date: "2026-06-15",
  },
  {
    id: "tx-003",
    type: "earned",
    points: 1580,
    balanceAfter: 1700,
    description: "Compra física TUU",
    source: "tuu_sale",
    date: "2026-06-20",
  },
];

// ── Mock Physical Sales (from AdminPage Puntos section) ───────────────────────
export const mockPhysicalSales: PhysicalSale[] = [
  {
    id: "sale-001",
    customerId: "cust-001",
    customerName: "Milenka Burgos",
    customerEmail: "miel.designer1@gmail.com",
    amount: 25000,
    pointsEarned: 250,
    paymentMethod: "tuu",
    boletaStatus: "issued",
    boletaFolio: "B-001234",
    date: "2026-06-20T15:30:00.000Z",
    operatorName: "Camila",
  },
  {
    id: "sale-002",
    customerId: null,
    customerName: null,
    customerEmail: null,
    amount: 42342,
    pointsEarned: 0,
    paymentMethod: "cash",
    boletaStatus: "issued",
    boletaFolio: "B-001235",
    date: "2026-06-21T11:00:00.000Z",
    operatorName: "Camila",
  },
];

// ── Mock Admin Dashboard (from AdminPage stats) ───────────────────────────────
export const mockAdminDashboard: AdminDashboard = {
  productsCount: 4,
  activeProducts: 3,
  draftProducts: 1,
  collectionsCount: 3,
  customersCount: 3,
  activeCustomersCount: 2,
  physicalSalesCount: 3,
  physicalSalesTotal: 67342,
  outstandingPoints: 2120,
  redemptionsCount: 1,
  pendingRedemptions: 1,
  recentSales: mockPhysicalSales,
  lowStockProducts: [
    { id: "prod-006", title: "Kit Papelería Completo", stock: 3 },
    { id: "prod-002", title: "Cuaderno Ilustrado A5", stock: 5 },
  ],
};
