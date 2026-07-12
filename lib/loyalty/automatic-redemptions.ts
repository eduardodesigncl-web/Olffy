import "server-only";

import {
  approveRewardRedemption,
  cancelShopifyRewardRedemption,
} from "lib/loyalty/redemptions";
import { redeemReward } from "lib/loyalty/service";

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
