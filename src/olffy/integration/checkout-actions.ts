"use server";

import { redirectToCheckoutWithEmail } from "components/cart/actions";
import { getCustomerAccountState } from "lib/customer/auth";
import { issueAutomaticRewardRedemption } from "lib/loyalty/automatic-redemptions";
import { cancelShopifyRewardRedemption } from "lib/loyalty/redemptions";
import { getCustomerBalance, listRewards } from "lib/loyalty/service";
import {
  getCart,
  updateCartBuyerEmail,
  updateCartDiscountCodes,
} from "lib/shopify";
import { prepareOnlineSale } from "lib/transactions/online";
import { updateTag } from "next/cache";
import { TAGS } from "lib/constants";
import type { AppliedCheckoutReward } from "src/olffy/types";

// Inicia el pago real desde el checkout del storefront oficial: crea la
// intención de pago TUU (o redirige al checkout de Shopify si TUU está
// deshabilitado). El email del invitado se usa para acumular OLFFY Puntos.
export async function startCheckoutAction(guestEmail?: string) {
  await redirectToCheckoutWithEmail(guestEmail);
}

export async function estimateCheckoutPointsAction(guestEmail?: string) {
  const cart = await getCart();
  if (!cart) throw new Error("No se pudo cargar el carrito");
  const subtotal = Math.round(Number(cart.cost.subtotalAmount.amount));
  const total = Math.round(Number(cart.cost.totalAmount.amount));
  const discount = Math.max(subtotal - total, 0);
  const snapshot = await prepareOnlineSale({
    customerEmail: guestEmail,
    discount,
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

export async function applyCheckoutRewardAction(
  rewardId: number,
): Promise<AppliedCheckoutReward> {
  if (!Number.isSafeInteger(rewardId) || rewardId <= 0) {
    throw new Error("La recompensa seleccionada no es válida");
  }

  const account = await getCustomerAccountState();
  if (account.status !== "ready") {
    throw new Error("Inicia sesión para usar tus puntos en esta compra");
  }
  if (account.customer.status !== "active") {
    throw new Error("Tu cuenta de puntos no está activa");
  }

  const cart = await getCart();
  if (!cart || cart.lines.length === 0) {
    throw new Error("No se pudo cargar el carrito");
  }

  const [snapshot, rewards] = await Promise.all([
    prepareOnlineSale({
      customerEmail: account.customer.email,
      items: cart.lines.map((line) => ({
        variantId: line.merchandise.id,
        quantity: line.quantity,
      })),
    }),
    listRewards(true),
  ]);
  const reward = rewards.find((candidate) => candidate.id === rewardId);

  if (
    !reward ||
    reward.reward_type !== "discount" ||
    !reward.discount_amount_clp ||
    reward.discount_amount_clp <= 0
  ) {
    throw new Error("Esta recompensa no está disponible para pago online");
  }
  if (reward.points_cost > account.customer.points_balance) {
    throw new Error("No tienes puntos suficientes para esta recompensa");
  }
  if (snapshot.subtotal < reward.minimum_purchase_clp) {
    throw new Error(
      `Esta recompensa requiere una compra mínima de $${reward.minimum_purchase_clp.toLocaleString("es-CL")}`,
    );
  }

  const identifiedCart = await updateCartBuyerEmail(account.customer.email);
  const actor = `customer:checkout:${account.user.id}`;
  const issued = await issueAutomaticRewardRedemption({
    customerId: account.customer.id,
    rewardId: reward.id,
    createdBy: actor,
    metadata: {
      channel: "online_checkout",
      shopify_cart_id: cart.id,
    },
  });
  const previousCodes = (identifiedCart.discountCodes ?? []).map(
    ({ code }) => code,
  );

  try {
    const updatedCart = await updateCartDiscountCodes([
      ...previousCodes,
      issued.code,
    ]);
    const applied = updatedCart.discountCodes.find(
      ({ code }) => code.toLowerCase() === issued.code.toLowerCase(),
    );

    if (!applied?.applicable) {
      throw new Error(
        "Shopify no pudo aplicar esta recompensa al contenido del carrito",
      );
    }

    updateTag(TAGS.cart);
    const pointsBalance = await getCustomerBalance(account.customer.id);

    return {
      rewardId: reward.id,
      name: reward.name,
      code: issued.code,
      pointsSpent: reward.points_cost,
      pointsBalance,
      discountAmountClp: reward.discount_amount_clp,
      total: Math.round(Number(updatedCart.cost.totalAmount.amount)),
    };
  } catch (cause) {
    try {
      await cancelShopifyRewardRedemption({
        redemptionId: issued.redemptionId,
        reason: "No se pudo aplicar el canje al carrito online",
        createdBy: actor,
      });
      await updateCartDiscountCodes(previousCodes);
      updateTag(TAGS.cart);
    } catch (rollbackError) {
      console.error(
        "El canje online requiere conciliación después de fallar:",
        rollbackError,
      );
      throw new Error(
        "No se pudo aplicar el canje y su reversa requiere revisión. Contacta a OLFFY antes de reintentar.",
      );
    }

    throw cause instanceof Error
      ? cause
      : new Error("No se pudo aplicar la recompensa al carrito");
  }
}
