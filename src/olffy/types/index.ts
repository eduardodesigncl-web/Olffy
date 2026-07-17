// Tipos base compartidos por todo el frontend OLFFY.
// Reflejan la forma de los datos mock — cuando exista backend real,
// estos tipos son el contrato a mantener (o migrar) en la integración.

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSpec {
  l: string; // label, ej. "TAMAÑO"
  v: string; // value, ej. "A5 (15 × 21 cm)"
}

export interface ProductBundle {
  name: string;
  desc: string;
  price: string;
  n: number;
}

export type ProductTag =
  | ''
  | 'Nuevo'
  | 'NUEVO'
  | 'Favorito'
  | 'Especial'
  | 'Agotado';

export interface Product {
  id: string; // Shopify product GID
  handle: string; // handle de Shopify, usado en rutas /tienda/[handle]
  name: string;
  cat: string;
  price: string; // formateado, ej. "$8.990"
  n: number; // precio numérico en CLP
  tag: ProductTag;
  bg: string; // color de fondo del placeholder de imagen
  colors: ProductColor[];
  specs: ProductSpec[];
  bundle: ProductBundle | null;
  desc: string; // intro corta (bajo el precio en el detalle)
  fullDesc?: string; // descripción completa (acordeón), con saltos de línea
  // Imágenes reales opcionales (cuando existan). Sin ellas, las cards y la
  // galería dibujan una composición mock según categoría (portada + interior).
  image?: string; // portada / vista principal (Shopify CDN)
  hoverImage?: string; // vista secundaria (interior/detalle) en hover
  images?: string[]; // galería completa (detalle de producto)
  variantId: string; // variante por defecto para agregar al carrito
  availableForSale: boolean;
}

export interface CartItem extends Product {
  qty: number;
  lineId: string; // id de la línea del carrito Shopify
}

export type Category = string;

export interface HeroSlide {
  bg: string;
  eyebrow: string;
  serif: string;
  display: string;
  subtitle: string;
  cta: string;
  ctaBg: string;
  ctaColor: string;
  textColor: string;
  mutedColor: string;
  wmColor: string;
  ctaPage: string;
}

export interface QuizOption {
  label: string;
  value: string;
  // Nombre de ícono GiftIcon (line icon SVG) — reemplaza el emoji del export
  // original de Cloud Design.
  icon?: string;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export interface Customer {
  nombre: string;
  email: string;
  puntos: number;
  nivel: string;
  puntosNextNivel: number;
  historial: PuntosHistorialItem[];
  recompensas: Reward[];
}

export interface PuntosHistorialItem {
  fecha: string;
  descripcion: string;
  puntos: string; // ej. "+120" o "−500"
  color: string;
}

export interface Reward {
  id: number;
  nombre: string;
  emoji: string;
  puntos: number;
  disponible: boolean;
}

export interface AdminMetric {
  label: string;
  value: string | number;
  footnote?: string;
  color?: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

// ── Tipos de integración OLFFY Puntos (backend Supabase) ──────────────────

export interface CheckoutLoyaltyReward {
  id: number;
  name: string;
  description: string | null;
  pointsCost: number;
  discountAmountClp: number;
  minimumPurchaseClp: number;
}

export interface CheckoutLoyaltyData {
  signedIn: boolean;
  customerName?: string;
  pointsBalance: number;
  rewards: CheckoutLoyaltyReward[];
}

export interface AppliedCheckoutReward {
  rewardId: number;
  name: string;
  code: string;
  pointsSpent: number;
  pointsBalance: number;
  discountAmountClp: number;
  total: number;
}

export interface StorefrontLoyaltyReward extends CheckoutLoyaltyReward {
  eligible: boolean;
  missingPoints: number;
  minimumMissingClp: number;
}

export interface StorefrontAppliedReward {
  redemptionId: number;
  rewardId: number;
  name: string;
  code: string;
  pointsSpent: number;
  discountAmountClp: number;
  expiresAt: string | null;
  applicable: boolean;
}

export type StorefrontLoyaltyState = {
  accountStatus: 'signed_out' | 'not_enrolled' | 'blocked' | 'ready';
  displayName?: string;
  initial?: string;
  pointsBalance: number;
  subtotal: number;
  discount: number;
  total: number;
  rewards: StorefrontLoyaltyReward[];
  activeReward: StorefrontAppliedReward | null;
};

export type StorefrontLoyaltyActionResult =
  | { ok: true; state: StorefrontLoyaltyState; message?: string }
  | { ok: false; state?: StorefrontLoyaltyState; message: string };
