"use server";

import { TAGS } from "lib/constants";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  type CartLinesMutationResult,
} from "lib/shopify";
import {
  cartErrorMessage,
  interpretCartUserErrors,
  type CartDomainErrorCode,
} from "lib/shopify/cart-errors";
import type { Cart } from "lib/shopify/types";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { toOlffyCartItems } from "./mappers";
import type { CartItem, CartMutationResult } from "../types";

// Acciones de carrito OLFFY. Cada mutación devuelve el carrito real ya
// mapeado (CartMutationResult): la UI optimista reconcilia con esta única
// respuesta y no existe una segunda lectura getCart en el camino feliz.

// Devuelve el carrito real de Shopify ya mapeado al tipo del frontend.
// Se llama desde el cliente después del primer pintado, para que ninguna
// página bloquee su render esperando a Shopify.
export async function getCartItemsAction(): Promise<CartItem[]> {
  try {
    const cart = await getCart();
    return toOlffyCartItems(cart);
  } catch (error) {
    console.error("No se pudo cargar el carrito Shopify", error);
    return [];
  }
}

async function ensureCartCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existingCartId = cookieStore.get("cartId")?.value;

  if (existingCartId) return existingCartId;

  const cart = await createCart();
  cookieStore.set("cartId", cart.id!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return cart.id!;
}

function failure(
  code: CartDomainErrorCode | "NETWORK_ERROR",
  items: CartItem[] | null,
  message?: string,
): CartMutationResult {
  return {
    ok: false,
    items,
    code,
    message:
      message ??
      (code === "NETWORK_ERROR"
        ? "No pudimos actualizar el carrito. Intenta nuevamente."
        : cartErrorMessage(code)),
  };
}

// En una falla dura (excepción) se intenta recuperar el carrito real para
// que la UI pueda reconciliar; si tampoco responde, items = null y el
// cliente restaura su snapshot local.
async function failureWithRecovery(
  error: unknown,
  context: string,
): Promise<CartMutationResult> {
  console.error(`Mutación de carrito falló (${context})`, error);
  try {
    const cart = await getCart();
    return failure("SHOPIFY_ERROR", toOlffyCartItems(cart));
  } catch {
    return failure("SHOPIFY_ERROR", null);
  }
}

// Valida el resultado de una mutación contra el stock real que la propia
// respuesta trae (merchandise.quantityAvailable). Shopify Storefront no
// rechaza cantidades sobre stock en el carrito, así que el servidor corrige
// aquí: recorta la línea al máximo disponible y lo comunica como error
// recuperable. Nunca se confía solo en el máximo del cliente.
async function reconcileLineOverflow(
  cart: Cart,
  merchandiseId: string,
): Promise<CartMutationResult | null> {
  const line = cart.lines.find((l) => l.merchandise.id === merchandiseId);
  if (!line?.id) return null;

  const available = line.merchandise.quantityAvailable;
  if (typeof available !== "number" || line.quantity <= available) {
    return null;
  }

  if (available <= 0) {
    const removed = await removeFromCart([line.id]);
    return {
      ok: false,
      items: toOlffyCartItems(removed.cart),
      code: "OUT_OF_STOCK",
      message: cartErrorMessage("OUT_OF_STOCK"),
    };
  }

  const clamped = await updateCart([
    {
      id: line.id,
      merchandiseId,
      quantity: available,
    },
  ]);
  return {
    ok: false,
    items: toOlffyCartItems(clamped.cart),
    code: "INSUFFICIENT_STOCK",
    message: cartErrorMessage("INSUFFICIENT_STOCK", available),
  };
}

async function toMutationResult(
  result: CartLinesMutationResult,
  merchandiseId: string | null,
): Promise<CartMutationResult> {
  const domainError = interpretCartUserErrors(result.userErrors);
  if (domainError) {
    console.error(
      "Shopify userErrors en mutación de carrito",
      result.userErrors,
    );
    return failure(
      domainError.code,
      result.cart ? toOlffyCartItems(result.cart) : null,
      domainError.message,
    );
  }

  if (!result.cart) {
    return failure("SHOPIFY_ERROR", null);
  }

  if (merchandiseId) {
    const overflow = await reconcileLineOverflow(result.cart, merchandiseId);
    if (overflow) {
      updateTag(TAGS.cart);
      return overflow;
    }
  }

  updateTag(TAGS.cart);
  return { ok: true, items: toOlffyCartItems(result.cart) };
}

// Agrega unidades de una variante. Devuelve el carrito completo mapeado.
export async function addCartLinesAction({
  merchandiseId,
  quantity,
}: {
  merchandiseId: string;
  quantity: number;
}): Promise<CartMutationResult> {
  if (!merchandiseId || quantity <= 0) {
    return failure("SHOPIFY_ERROR", null);
  }

  try {
    await ensureCartCookie();
    const result = await addToCart([
      { merchandiseId, quantity: Math.floor(quantity) },
    ]);
    return await toMutationResult(result, merchandiseId);
  } catch (error) {
    return failureWithRecovery(error, "addCartLines");
  }
}

// Fija la cantidad objetivo de una línea (idempotente): reemplaza a los
// antiguos increment/decrement que leían el carrito antes de mutar y
// generaban carreras entre clics rápidos. quantity <= 0 elimina la línea.
export async function setCartLineQuantityAction({
  lineId,
  merchandiseId,
  quantity,
}: {
  lineId: string;
  merchandiseId: string;
  quantity: number;
}): Promise<CartMutationResult> {
  if (!lineId || !merchandiseId) {
    return failure("SHOPIFY_ERROR", null);
  }

  try {
    if (quantity <= 0) {
      const result = await removeFromCart([lineId]);
      return await toMutationResult(result, null);
    }

    const result = await updateCart([
      { id: lineId, merchandiseId, quantity: Math.floor(quantity) },
    ]);
    return await toMutationResult(result, merchandiseId);
  } catch (error) {
    return failureWithRecovery(error, "setCartLineQuantity");
  }
}

// Elimina una línea del carrito.
export async function removeCartLinesAction(
  lineId: string,
): Promise<CartMutationResult> {
  if (!lineId) return failure("SHOPIFY_ERROR", null);

  try {
    const result = await removeFromCart([lineId]);
    return await toMutationResult(result, null);
  } catch (error) {
    return failureWithRecovery(error, "removeCartLines");
  }
}
