// Clasificación del sistema de pago por cliente. Mientras no exista un cruce
// real por cliente entre ventas físicas (TUU) y digitales (Shopify), no se
// inventan valores: todo cliente se reporta como "Sin venta" hasta tener datos.
export type PaymentSystem =
  | "Venta física"
  | "Venta web"
  | "Mixto"
  | "Sin venta";

export function derivePaymentSystem(_nombre: string): PaymentSystem {
  return "Sin venta";
}
