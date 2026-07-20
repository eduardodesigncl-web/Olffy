import type { CartLineUserError } from "./types";

// Códigos de dominio del carrito OLFFY. El cliente solo ve estos códigos y
// mensajes; el error crudo de Shopify se registra únicamente en el servidor.
export type CartDomainErrorCode =
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "NOT_AVAILABLE"
  | "SHOPIFY_ERROR";

export interface CartDomainError {
  code: CartDomainErrorCode;
  message: string;
}

export function cartErrorMessage(
  code: CartDomainErrorCode,
  availableQuantity?: number,
): string {
  switch (code) {
    case "OUT_OF_STOCK":
      return "Este producto se agotó mientras actualizábamos tu carrito.";
    case "INSUFFICIENT_STOCK":
      return typeof availableQuantity === "number"
        ? `Solo ${
            availableQuantity === 1
              ? "queda 1 unidad"
              : `quedan ${availableQuantity} unidades`
          }. Ajustamos la cantidad disponible.`
        : "No hay stock suficiente. Ajustamos la cantidad disponible.";
    case "NOT_AVAILABLE":
      return "Esta variante ya no está disponible.";
    case "SHOPIFY_ERROR":
      return "No pudimos actualizar el carrito. Intenta nuevamente.";
  }
}

// Palabras clave para clasificar userErrors cuando el code de Shopify no es
// concluyente (la API no versiona estos textos, por eso se busca amplio).
const OUT_OF_STOCK_HINTS = ["sold out", "out of stock", "agotado"];
const STOCK_LIMIT_HINTS = ["quantity", "stock", "inventory", "available"];
const NOT_AVAILABLE_HINTS = [
  "not available",
  "no longer available",
  "unavailable",
  "does not exist",
  "invalid merchandise",
  "no está disponible",
];

function includesAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

// Convierte los userErrors de cartLinesAdd/cartLinesUpdate en un código de
// dominio legible. Devuelve null cuando no hay errores.
export function interpretCartUserErrors(
  userErrors: CartLineUserError[] | undefined,
): CartDomainError | null {
  if (!userErrors?.length) return null;

  for (const error of userErrors) {
    const code = (error.code ?? "").toUpperCase();
    const message = error.message.toLowerCase();

    if (
      code.includes("OUT_OF_STOCK") ||
      includesAny(message, OUT_OF_STOCK_HINTS)
    ) {
      return {
        code: "OUT_OF_STOCK",
        message: cartErrorMessage("OUT_OF_STOCK"),
      };
    }
    if (
      code === "INVALID_MERCHANDISE_LINE" ||
      code === "MERCHANDISE_NOT_APPLICABLE" ||
      includesAny(message, NOT_AVAILABLE_HINTS)
    ) {
      return {
        code: "NOT_AVAILABLE",
        message: cartErrorMessage("NOT_AVAILABLE"),
      };
    }
    if (includesAny(message, STOCK_LIMIT_HINTS)) {
      return {
        code: "INSUFFICIENT_STOCK",
        message: cartErrorMessage("INSUFFICIENT_STOCK"),
      };
    }
  }

  return { code: "SHOPIFY_ERROR", message: cartErrorMessage("SHOPIFY_ERROR") };
}
