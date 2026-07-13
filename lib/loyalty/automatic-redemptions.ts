import "server-only";

import {
  approveRewardRedemption,
  cancelShopifyRewardRedemption,
} from "lib/loyalty/redemptions";
import {
  getRewardRedemption,
  redeemReward,
  redeemStorefrontCartReward,
} from "lib/loyalty/service";

export async function issueAutomaticRewardRedemption(input: {
  customerId: number;
  rewardId: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await redeemReward({
    customerId: input.customerId,
    rewardId: input.rewardId,
    createdBy: input.createdBy,
    metadata: input.metadata,
  });

  try {
    const redemption = await approveRewardRedemption({
      redemptionId: result.redemptionId,
      createdBy: input.createdBy,
    });

    if (!redemption.shopify_discount_code) {
      throw new Error("Shopify no devolvió el código del descuento");
    }

    return {
      ...result,
      redemption,
      code: redemption.shopify_discount_code,
    };
  } catch (approvalError) {
    try {
      await cancelShopifyRewardRedemption({
        redemptionId: result.redemptionId,
        reason: "Emisión automática fallida; puntos devueltos al cliente",
        createdBy: input.createdBy,
      });
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir automáticamente el canje fallido:",
        rollbackError,
      );
    }

    throw approvalError;
  }
}

export async function issueStorefrontCartRewardRedemption(input: {
  customerId: number;
  rewardId: number;
  storefrontCartId: string;
  requestId: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}) {
  const result = await redeemStorefrontCartReward(input);

  if (result.alreadyExists) {
    const existing = await getRewardRedemption(result.redemptionId);
    if (
      existing.status === "approved" &&
      existing.shopify_discount_code &&
      (!existing.shopify_discount_ends_at ||
        new Date(existing.shopify_discount_ends_at).getTime() > Date.now())
    ) {
      return {
        ...result,
        redemption: existing,
        code: existing.shopify_discount_code,
      };
    }

    throw new Error(
      existing.status === "reconciliation_required"
        ? "El canje de este carrito requiere conciliación antes de reintentar."
        : "El canje de este carrito todavía se está procesando.",
    );
  }

  try {
    const redemption = await approveRewardRedemption({
      redemptionId: result.redemptionId,
      createdBy: input.createdBy,
    });

    if (!redemption.shopify_discount_code) {
      throw new Error("Shopify no devolvió el código del descuento");
    }

    return {
      ...result,
      redemption,
      code: redemption.shopify_discount_code,
    };
  } catch (approvalError) {
    try {
      await cancelShopifyRewardRedemption({
        redemptionId: result.redemptionId,
        reason: "Emisión automática del carrito fallida; puntos devueltos",
        createdBy: input.createdBy,
      });
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir automáticamente el canje del carrito:",
        rollbackError,
      );
    }

    throw approvalError;
  }
}
