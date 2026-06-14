import "server-only";

import {
  createShopifyBasicCodeDiscount,
  deactivateShopifyCodeDiscount,
  getShopifyBasicCodeDiscount,
  ShopifyDiscountError,
} from "lib/shopify/discounts";
import {
  beginRewardRedemptionApproval,
  beginRewardRedemptionCancellation,
  completeRewardRedemptionApproval,
  completeRewardRedemptionCancellation,
  failRewardRedemptionApproval,
  failRewardRedemptionCancellation,
  getRewardRedemption,
  markRewardRedemptionReconciliationRequired,
  markRewardRedemptionUsed,
} from "./service";

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Ocurrió un error inesperado";
}

async function requireReconciliation(input: {
  redemptionId: number;
  error: string;
  createdBy: string;
}) {
  try {
    await markRewardRedemptionReconciliationRequired(input);
  } catch (cause) {
    console.error("No se pudo marcar el canje para conciliación.", cause);
  }
}

export async function approveRewardRedemption(input: {
  redemptionId: number;
  createdBy: string;
}) {
  const prepared = await beginRewardRedemptionApproval(input);
  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() + prepared.validityDays * 24 * 60 * 60 * 1000,
  );
  let createdDiscount:
    | Awaited<ReturnType<typeof createShopifyBasicCodeDiscount>>
    | undefined;

  try {
    createdDiscount = await createShopifyBasicCodeDiscount({
      title: `${prepared.rewardName} · Canje #${prepared.redemptionId}`,
      code: prepared.shopifyDiscountCode,
      discountAmountClp: prepared.discountAmountClp,
      minimumPurchaseClp: prepared.minimumPurchaseClp,
      startsAt,
      endsAt,
      shopifyCustomerId: prepared.shopifyCustomerId,
    });

    return await completeRewardRedemptionApproval({
      redemptionId: prepared.redemptionId,
      shopifyDiscountNodeId: createdDiscount.nodeId,
      shopifyDiscountCreatedAt: createdDiscount.startsAt,
      shopifyDiscountEndsAt: createdDiscount.endsAt ?? endsAt.toISOString(),
      createdBy: input.createdBy,
    });
  } catch (cause) {
    const message = errorMessage(cause);

    if (!createdDiscount) {
      const requiresReconciliation =
        cause instanceof ShopifyDiscountError && cause.uncertainCreation;

      try {
        await failRewardRedemptionApproval({
          redemptionId: prepared.redemptionId,
          error: message,
          requiresReconciliation,
          createdBy: input.createdBy,
        });
      } catch (stateCause) {
        await requireReconciliation({
          redemptionId: prepared.redemptionId,
          error: `${message}. Además falló el registro del estado: ${errorMessage(
            stateCause,
          )}`,
          createdBy: input.createdBy,
        });
      }

      throw new Error(
        requiresReconciliation
          ? "Shopify dejó la creación en estado incierto. El canje requiere conciliación y no fue aprobado."
          : `Shopify no pudo crear el descuento. El canje sigue pendiente. ${message}`,
      );
    }

    try {
      await deactivateShopifyCodeDiscount(createdDiscount.nodeId);
      await failRewardRedemptionApproval({
        redemptionId: prepared.redemptionId,
        error: `Supabase no pudo finalizar la aprobación; Shopify fue compensado. ${message}`,
        requiresReconciliation: false,
        createdBy: input.createdBy,
      });
    } catch (compensationCause) {
      await requireReconciliation({
        redemptionId: prepared.redemptionId,
        error: `Falló la aprobación y no se pudo confirmar la compensación Shopify: ${errorMessage(
          compensationCause,
        )}`,
        createdBy: input.createdBy,
      });

      throw new Error(
        "El descuento pudo quedar activo en Shopify. El canje requiere conciliación y los puntos no fueron devueltos.",
      );
    }

    throw new Error(
      "No se pudo guardar la aprobación. El descuento Shopify fue desactivado y el canje sigue pendiente.",
    );
  }
}

export async function cancelShopifyRewardRedemption(input: {
  redemptionId: number;
  reason: string;
  createdBy: string;
  expired?: boolean;
}) {
  const prepared = await beginRewardRedemptionCancellation(input);

  if (!prepared.requiresShopify) {
    return;
  }

  if (!prepared.shopifyDiscountNodeId) {
    await requireReconciliation({
      redemptionId: input.redemptionId,
      error: "El canje aprobado no tiene Shopify DiscountCodeNode ID.",
      createdBy: input.createdBy,
    });
    throw new Error(
      "El canje no tiene un identificador Shopify válido y requiere conciliación.",
    );
  }

  if (
    input.expired &&
    prepared.shopifyDiscountEndsAt &&
    new Date(prepared.shopifyDiscountEndsAt).getTime() > Date.now()
  ) {
    await failRewardRedemptionCancellation({
      redemptionId: input.redemptionId,
      error: "Se intentó procesar el vencimiento antes de endsAt.",
      createdBy: input.createdBy,
    });
    throw new Error("El descuento todavía está vigente.");
  }

  let deactivated = false;

  try {
    const discount = await getShopifyBasicCodeDiscount(
      prepared.shopifyDiscountNodeId,
    );

    if (!discount) {
      throw new ShopifyDiscountError(
        "Shopify no encontró el descuento aprobado.",
      );
    }

    if (discount.usageCount > 0) {
      await markRewardRedemptionUsed({
        redemptionId: input.redemptionId,
        usageCount: discount.usageCount,
        createdBy: input.createdBy,
      });
      throw new Error(
        "El descuento ya fue usado. El canje quedó como entregado y los puntos no se devolvieron.",
      );
    }

    if (discount.status === "ACTIVE" || discount.status === "SCHEDULED") {
      await deactivateShopifyCodeDiscount(prepared.shopifyDiscountNodeId);
    }
    deactivated = true;

    return await completeRewardRedemptionCancellation({
      redemptionId: input.redemptionId,
      reason: input.reason,
      createdBy: input.createdBy,
      expired: Boolean(input.expired),
    });
  } catch (cause) {
    const message = errorMessage(cause);

    if (message.includes("El descuento ya fue usado")) {
      throw cause;
    }

    if (deactivated) {
      await requireReconciliation({
        redemptionId: input.redemptionId,
        error: `Shopify desactivó el descuento, pero Supabase no pudo devolver los puntos: ${message}`,
        createdBy: input.createdBy,
      });
      throw new Error(
        "Shopify desactivó el descuento, pero la devolución de puntos requiere conciliación.",
      );
    }

    try {
      await failRewardRedemptionCancellation({
        redemptionId: input.redemptionId,
        error: message,
        createdBy: input.createdBy,
      });
    } catch (stateCause) {
      await requireReconciliation({
        redemptionId: input.redemptionId,
        error: `${message}. No se pudo restaurar el estado: ${errorMessage(
          stateCause,
        )}`,
        createdBy: input.createdBy,
      });
    }

    throw new Error(
      `No se canceló el canje y los puntos no fueron devueltos. ${message}`,
    );
  }
}

export async function syncShopifyRewardRedemptionUsage(input: {
  redemptionId: number;
  createdBy: string;
}) {
  const redemption = await getRewardRedemption(input.redemptionId);

  if (
    redemption.status !== "approved" ||
    !redemption.shopify_discount_node_id
  ) {
    throw new Error("El canje no tiene un descuento Shopify aprobado.");
  }

  const discount = await getShopifyBasicCodeDiscount(
    redemption.shopify_discount_node_id,
  );

  if (!discount || discount.usageCount < 1) {
    throw new Error("Shopify todavía no registra uso para este descuento.");
  }

  return markRewardRedemptionUsed({
    redemptionId: input.redemptionId,
    usageCount: discount.usageCount,
    createdBy: input.createdBy,
  });
}
