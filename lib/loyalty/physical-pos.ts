import "server-only";

import { createHash } from "node:crypto";
import {
  calculatePointsForAmount,
  getActiveLoyaltyRule,
  getLoyaltyCustomer,
  type LoyaltyCustomer,
  type PhysicalSaleAttempt,
  type PhysicalSaleItemInput,
  type PhysicalSalePosBenefit,
  finalizePhysicalSalePos,
  markRewardRedemptionUsed,
} from "lib/loyalty/service";
import { isExcludedFromLoyalty } from "lib/loyalty/eligibility";
import {
  createOrFindPaidPhysicalOrder,
  getAdminProductVariantsByIds,
} from "lib/shopify/admin";
import { finalizePhysicalOperation } from "lib/transactions/orchestrator";
import { getSupabaseAdmin } from "lib/supabase/admin";

export type PhysicalSalePosRequest = {
  customerId?: number | null;
  items?: Array<{ variantId?: string; quantity?: number }>;
  benefitType?: PhysicalSalePosBenefit;
  pointsToUse?: number;
  benefitAmount?: number;
  discountCode?: string;
  manualDiscountReason?: string;
};

export type PreparedPhysicalSale = {
  customer?: LoyaltyCustomer;
  items: Array<PhysicalSaleItemInput & { excludedFromLoyalty?: boolean }>;
  benefitType: PhysicalSalePosBenefit;
  pointsSpent: number;
  pointsEarned: number;
  discountCode?: string;
  rewardRedemptionId?: number;
  manualDiscountReason?: string;
  subtotal: number;
  /** Subtotal de productos que participan en OLFFY Puntos (carrito mixto). */
  eligibleSubtotal: number;
  discount: number;
  total: number;
  /** Monto elegible efectivamente pagado: base de acumulación de puntos. */
  eligibleTotal: number;
  fingerprint: string;
};

export function physicalSaleErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la venta TUU";
}

export function requiredPhysicalSaleText(
  value: unknown,
  label: string,
): string {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`Falta ${label}`);
  }

  return normalized;
}

function positiveAmount(value: unknown, label: string): number {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} debe ser mayor que cero`);
  }

  return amount;
}

export async function preparePhysicalSale(
  input: PhysicalSalePosRequest,
): Promise<PreparedPhysicalSale> {
  const benefitType = input.benefitType ?? "none";
  const requestedItems = input.items ?? [];

  if (
    !["none", "points", "discount_code", "manual_discount"].includes(
      benefitType,
    )
  ) {
    throw new Error("El beneficio seleccionado no es valido");
  }

  if (requestedItems.length === 0) {
    throw new Error("Agrega al menos un producto al carrito");
  }

  const quantityByVariant = new Map<string, number>();

  for (const item of requestedItems) {
    const variantId = requiredPhysicalSaleText(
      item.variantId,
      "la variante Shopify",
    );
    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      throw new Error("Las cantidades deben ser enteros entre 1 y 100");
    }

    quantityByVariant.set(
      variantId,
      (quantityByVariant.get(variantId) ?? 0) + quantity,
    );
  }

  const variantIds = [...quantityByVariant.keys()].sort();
  const variants = await getAdminProductVariantsByIds(variantIds);
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  if (variants.length !== variantIds.length) {
    throw new Error(
      "Uno o mas productos ya no existen en Shopify. Actualiza el carrito.",
    );
  }

  const items = variantIds.map((variantId) => {
    const variant = variantById.get(variantId);
    const quantity = quantityByVariant.get(variantId) ?? 0;

    if (!variant || variant.product.status !== "ACTIVE") {
      throw new Error("Uno de los productos ya no esta activo en Shopify");
    }

    if (variant.inventoryQuantity < quantity) {
      throw new Error(
        `Stock insuficiente para ${variant.product.title} - ${variant.title}. Disponible: ${variant.inventoryQuantity}.`,
      );
    }

    const unitPrice = Number(variant.price);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(
        `Shopify devolvio un precio invalido para ${variant.product.title}`,
      );
    }

    return {
      shopifyProductId: variant.product.id,
      shopifyVariantId: variant.id,
      sku: variant.sku ?? undefined,
      productTitle: variant.product.title,
      variantTitle: variant.title,
      quantity,
      unitPrice,
      excludedFromLoyalty: isExcludedFromLoyalty(variant.product.tags),
    };
  });
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  // Carrito mixto (propuesta v2): solo el subtotal elegible genera puntos y
  // soporta beneficios de puntos; los productos "Sin puntos" quedan fuera.
  const eligibleSubtotal = items.reduce(
    (sum, item) =>
      item.excludedFromLoyalty ? sum : sum + item.quantity * item.unitPrice,
    0,
  );
  const customerId = input.customerId ? Number(input.customerId) : undefined;
  const customer = customerId
    ? await getLoyaltyCustomer(customerId)
    : undefined;
  const rule = await getActiveLoyaltyRule();
  let discount = 0;
  let pointsSpent = 0;
  let discountCode: string | undefined;
  let rewardRedemptionId: number | undefined;
  let manualDiscountReason: string | undefined;

  if (customer && customer.status !== "active") {
    throw new Error("El cliente de puntos esta bloqueado");
  }

  if (benefitType === "points") {
    if (!customer) {
      throw new Error("Selecciona un cliente para usar puntos");
    }

    pointsSpent = Math.trunc(
      positiveAmount(input.pointsToUse, "Los puntos a usar"),
    );

    if (pointsSpent > customer.points_balance) {
      throw new Error("El cliente no tiene puntos suficientes");
    }

    discount = pointsSpent * rule.point_redemption_value_clp;

    if (discount >= eligibleSubtotal) {
      throw new Error(
        "El descuento por puntos solo puede aplicarse sobre productos que participan en OLFFY Puntos",
      );
    }
  } else if (benefitType === "discount_code") {
    if (!customer) {
      throw new Error("Selecciona la clienta dueña del código de descuento");
    }

    discountCode = requiredPhysicalSaleText(
      input.discountCode,
      "el codigo de descuento",
    ).toUpperCase();
    const { data: redemption, error: redemptionError } =
      await getSupabaseAdmin()
        .from("reward_redemptions")
        .select(
          "id, customer_id, status, shopify_discount_ends_at, rewards(discount_amount_clp, minimum_purchase_clp)",
        )
        .ilike("shopify_discount_code", discountCode)
        .maybeSingle();

    if (redemptionError) {
      throw new Error(
        `No se pudo validar el código de descuento: ${redemptionError.message}`,
      );
    }
    if (!redemption || redemption.status !== "approved") {
      throw new Error("El código no existe, ya fue usado o no está activo");
    }
    if (Number(redemption.customer_id) !== customer.id) {
      throw new Error("El código pertenece a otra clienta");
    }
    if (
      redemption.shopify_discount_ends_at &&
      new Date(redemption.shopify_discount_ends_at).getTime() <= Date.now()
    ) {
      throw new Error("El código de descuento está vencido");
    }

    const reward = Array.isArray(redemption.rewards)
      ? redemption.rewards[0]
      : redemption.rewards;
    const minimumPurchase = Number(reward?.minimum_purchase_clp ?? 0);
    if (subtotal < minimumPurchase) {
      throw new Error(
        `El código requiere una compra mínima de $${minimumPurchase.toLocaleString("es-CL")}`,
      );
    }

    discount = positiveAmount(
      reward?.discount_amount_clp,
      "El monto configurado del descuento",
    );
    rewardRedemptionId = Number(redemption.id);
  } else if (benefitType === "manual_discount") {
    manualDiscountReason = requiredPhysicalSaleText(
      input.manualDiscountReason,
      "la autorizacion del descuento manual",
    );
    discount = positiveAmount(input.benefitAmount, "El monto del descuento");
  }

  if (discount >= subtotal) {
    throw new Error(
      "El beneficio debe dejar un total mayor que cero para cobrar por TUU",
    );
  }

  const total = subtotal - discount;
  // Base de acumulación: monto elegible pagado. El descuento se atribuye al
  // subtotal elegible (los beneficios de puntos solo aplican ahí y es la
  // lectura conservadora para códigos/descuentos manuales).
  const eligibleTotal = Math.max(
    Math.min(eligibleSubtotal - discount, total),
    0,
  );
  const pointsEarned = customer
    ? calculatePointsForAmount(eligibleTotal, rule)
    : 0;
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        customerId: customer?.id ?? null,
        items: items.map((item) => ({
          variantId: item.shopifyVariantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        benefitType,
        pointsSpent,
        discount,
        discountCode: discountCode ?? null,
        manualDiscountReason: manualDiscountReason ?? null,
        subtotal,
        eligibleSubtotal,
        total,
      }),
    )
    .digest("hex");

  return {
    customer,
    items,
    benefitType,
    pointsSpent,
    pointsEarned,
    discountCode,
    rewardRedemptionId,
    manualDiscountReason,
    subtotal,
    eligibleSubtotal,
    discount,
    total,
    eligibleTotal,
    fingerprint,
  };
}

export async function finalizePreparedPhysicalSale(input: {
  prepared: PreparedPhysicalSale;
  attempt: Required<Pick<PhysicalSaleAttempt, "attemptId" | "claimToken">>;
  paymentReference: string;
  receiptNumber?: string;
  responsible: string;
  notes?: string;
  olffyReference?: string;
  saleChannelDetail: "physical_tuu_manual" | "physical_tuu_remote";
  providerTransactionId?: string;
  providerPayload?: Record<string, unknown>;
}): Promise<{
  physicalSaleId: number;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  alreadyCompleted: boolean;
  transactionPipelineWarning?: string;
}> {
  const { prepared } = input;
  const paymentReference = input.paymentReference.trim();
  const olffyReference = input.olffyReference?.trim() || paymentReference;
  const shopifyOrder = await createOrFindPaidPhysicalOrder({
    tuuTransactionId: paymentReference,
    olffyReference,
    saleChannelDetail: input.saleChannelDetail,
    receiptNumber: input.receiptNumber,
    responsible: input.responsible,
    notes: input.notes,
    customer: prepared.customer
      ? {
          email: prepared.customer.email,
          shopifyCustomerId: prepared.customer.shopify_customer_id,
        }
      : undefined,
    items: prepared.items.map((item) => ({
      variantId: item.shopifyVariantId!,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    discount:
      prepared.discount > 0
        ? {
            code:
              prepared.benefitType === "points"
                ? `OLFFY-PUNTOS-${prepared.pointsSpent}`
                : prepared.benefitType === "manual_discount"
                  ? "OLFFY-DESCUENTO-MANUAL"
                  : prepared.discountCode!,
            amount: prepared.discount,
          }
        : undefined,
    total: prepared.total,
    metafields: input.providerTransactionId
      ? [
          {
            namespace: "olffy",
            key: "tuu_provider_transaction_id",
            value: input.providerTransactionId,
          },
        ]
      : undefined,
  });

  const result = await finalizePhysicalSalePos({
    attemptId: input.attempt.attemptId,
    claimToken: input.attempt.claimToken,
    customerId: prepared.customer?.id,
    tuuTransactionId: paymentReference,
    receiptNumber: input.receiptNumber,
    shopifyOrderId: shopifyOrder.id,
    shopifyOrderName: shopifyOrder.name,
    subtotal: prepared.subtotal,
    discount: prepared.discount,
    total: prepared.total,
    eligibleTotal: prepared.eligibleTotal ?? prepared.total,
    benefitType: prepared.benefitType,
    pointsSpent: prepared.pointsSpent,
    pointsEarned: prepared.pointsEarned,
    discountCode: prepared.discountCode,
    manualDiscountReason: prepared.manualDiscountReason,
    items: prepared.items,
    notes: input.notes,
    createdBy: input.responsible,
    metadata: {
      shopify_order_reused: shopifyOrder.reused,
      payment_method: "tuu",
      payment_mode:
        input.saleChannelDetail === "physical_tuu_remote"
          ? "remote_pos"
          : "manual_pos",
      provider_transaction_id: input.providerTransactionId,
      provider_payload: input.providerPayload,
    },
  });
  let transactionPipelineWarning: string | undefined;

  try {
    await finalizePhysicalOperation({
      olffyReference,
      paymentReference,
      shopifyOrderId: result.shopifyOrderId,
      shopifyOrderName: result.shopifyOrderName,
      physicalSaleId: result.physicalSaleId,
      snapshot: {
        channel: "physical",
        saleChannelDetail: input.saleChannelDetail,
        items: prepared.items.map((item) => ({
          ...item,
          shopifyVariantId: item.shopifyVariantId!,
          variantTitle: item.variantTitle ?? "Default Title",
        })),
        subtotal: prepared.subtotal,
        discount: prepared.discount,
        total: prepared.total,
        currency: "CLP",
        pointsEarned: prepared.pointsEarned,
        customer: prepared.customer
          ? {
              loyaltyCustomerId: prepared.customer.id,
              shopifyCustomerId:
                prepared.customer.shopify_customer_id ?? undefined,
              email: prepared.customer.email,
              marketingConsent:
                prepared.customer.metadata.marketing_consent === true,
            }
          : undefined,
      },
    });
  } catch (pipelineError) {
    transactionPipelineWarning =
      pipelineError instanceof Error
        ? pipelineError.message
        : "La venta requiere conciliacion";
    console.error(
      "Physical sale completed with transaction pipeline warning:",
      pipelineError,
    );
  }

  if (prepared.rewardRedemptionId && !result.alreadyCompleted) {
    try {
      await markRewardRedemptionUsed({
        redemptionId: prepared.rewardRedemptionId,
        usageCount: 1,
        createdBy: input.responsible,
      });
    } catch (redemptionError) {
      transactionPipelineWarning = [
        transactionPipelineWarning,
        redemptionError instanceof Error
          ? redemptionError.message
          : "El uso del código requiere conciliación",
      ]
        .filter(Boolean)
        .join(" · ");
      console.error(
        "Physical sale completed but reward redemption usage was not recorded:",
        redemptionError,
      );
    }
  }

  return {
    physicalSaleId: result.physicalSaleId,
    shopifyOrderId: result.shopifyOrderId,
    shopifyOrderName: result.shopifyOrderName,
    alreadyCompleted: result.alreadyCompleted,
    transactionPipelineWarning,
  };
}
