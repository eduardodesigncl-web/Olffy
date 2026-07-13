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

export type ProductTag = "" | "Nuevo" | "NUEVO" | "Favorito" | "Especial";

export interface Product {
  id: number;
  name: string;
  handle?: string;
  shopifyId?: string;
  /** Metafield Shopify olffy.exclude_from_points. */
  sinPuntos?: boolean;
  variantId?: string;
  status?: string;
  stock?: number;
  cat: string;
  price: string; // formateado, ej. "$8.990"
  n: number; // precio numérico en CLP
  tag: ProductTag;
  bg: string; // color de fondo del placeholder de imagen
  image?: string;
  images?: string[];
  colors: ProductColor[];
  specs: ProductSpec[];
  bundle: ProductBundle | null;
  desc: string;
}

export interface CartItem extends Product {
  qty: number;
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
