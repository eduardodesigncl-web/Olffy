"use server";

import { redirectToCheckoutWithEmail } from "components/cart/actions";

// Inicia el pago real desde el checkout del storefront oficial: crea la
// intención de pago TUU (o redirige al checkout de Shopify si TUU está
// deshabilitado). El email del invitado se usa para acumular OLFFY Puntos.
export async function startCheckoutAction(guestEmail?: string) {
  await redirectToCheckoutWithEmail(guestEmail);
}
