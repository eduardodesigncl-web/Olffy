// Sistema de pago por cliente (mock/local). Derivado por nombre para no alterar
// ADMIN_DATA. En producción vendría del cruce de ventas físicas (TUU) y digitales
// (Shopify) por cliente.
export type PaymentSystem =
  | "Venta física"
  | "Venta web"
  | "Mixto"
  | "Sin venta";

const OVERRIDES: Record<string, PaymentSystem> = {
  "Valentina García": "Venta física",
  "Camila Torres": "Venta web",
  "Milenka Burgos": "Mixto",
};

export function derivePaymentSystem(nombre: string): PaymentSystem {
  return OVERRIDES[nombre] ?? "Sin venta";
}
