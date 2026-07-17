"use server";

import { getCart } from "lib/shopify";
import { toOlffyCartItems } from "./mappers";
import type { CartItem } from "../types";

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
