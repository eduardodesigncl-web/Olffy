"use server";

import { redirectToCheckoutWithEmail } from "components/cart/actions";
import { getCart } from "lib/shopify";
import { prepareOnlineSale } from "lib/transactions/online";

// Inicia el pago real desde el checkout del storefront oficial: crea la
// intención de pago TUU (o redirige al checkout de Shopify si TUU está
// deshabilitado). El email del invitado se usa para acumular OLFFY Puntos.
export async function startCheckoutAction(guestEmail?: string) {
  await redirectToCheckoutWithEmail(guestEmail);
}

export async function estimateCheckoutPointsAction(guestEmail?: string) {
  const cart = await getCart();
  if (!cart) throw new Error("No se pudo cargar el carrito");
  const snapshot = await prepareOnlineSale({
    customerEmail: guestEmail,
    items: cart.lines.map((line) => ({
      variantId: line.merchandise.id,
      quantity: line.quantity,
    })),
  });

  return {
    points:
      Math.floor(snapshot.eligibleTotal / snapshot.rule.spendingUnitClp) *
      snapshot.rule.pointsPerUnit,
    eligibleTotal: snapshot.eligibleTotal,
    excludedTotal: snapshot.excludedTotal,
    rule: snapshot.rule,
  };
}
