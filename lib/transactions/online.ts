import "server-only";

import { randomUUID } from "node:crypto";
import {
  getActiveLoyaltyRule,
  type LoyaltyCustomer,
} from "lib/loyalty/service";
import { calculateLoyaltySnapshot } from "lib/loyalty/calculation";
import { getAdminProductVariantsByIds } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { createTuuOnlineIntent } from "lib/tuu/online";
import {
  createPendingPaymentEvent,
  getPendingPaymentEvent,
  updatePaymentProviderReference,
} from "./repository";
import type { PaidSaleSnapshot } from "./types";

async function findLoyaltyCustomerByEmail(email?: string) {
  if (!email) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .select("*")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar el cliente: ${error.message}`);
  }

  return data as LoyaltyCustomer | null;
}

export async function prepareOnlineSale(input: {
  items: Array<{ variantId: string; quantity: number }>;
  customerEmail?: string;
}): Promise<PaidSaleSnapshot> {
  const quantityByVariant = new Map<string, number>();

  for (const requested of input.items) {
    const variantId = requested.variantId?.trim();
    const quantity = Number(requested.quantity);

    if (
      !variantId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 100
    ) {
      throw new Error(
        "El carrito TUU contiene una variante o cantidad invalida",
      );
    }

    quantityByVariant.set(
      variantId,
      (quantityByVariant.get(variantId) ?? 0) + quantity,
    );
  }

  const variantIds = [...quantityByVariant.keys()].sort();
  if (variantIds.length === 0) {
    throw new Error("El carrito TUU esta vacio");
  }

  const variants = await getAdminProductVariantsByIds(variantIds);
  if (variants.length !== variantIds.length) {
    throw new Error("Uno o mas productos ya no existen en Shopify");
  }

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const items = variantIds.map((variantId) => {
    const variant = variantById.get(variantId)!;
    const quantity = quantityByVariant.get(variantId)!;
    const unitPrice = Number(variant.price);

    if (
      variant.product.status !== "ACTIVE" ||
      variant.inventoryQuantity < quantity ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      throw new Error(
        `El producto ${variant.product.title} no tiene precio o stock valido`,
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
    };
  });
  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const customer = await findLoyaltyCustomerByEmail(input.customerEmail);
  const rule = await getActiveLoyaltyRule();
  const ruleSnapshot = {
    id: rule.id,
    name: rule.name,
    spendingUnitClp: rule.spending_unit_clp,
    pointsPerUnit: rule.points_per_unit,
  };
  const calculation = calculateLoyaltySnapshot({
    lines: items.map((item) => ({
      grossTotal: item.unitPrice * item.quantity,
      eligible: !variantById.get(item.shopifyVariantId)?.product
        .excludeFromPoints,
      exclusionReason: variantById.get(item.shopifyVariantId)?.product
        .excludeFromPoints
        ? "product_metafield_excluded"
        : undefined,
    })),
    discount: 0,
    rule: ruleSnapshot,
  });
  const calculatedItems = items.map((item, index) => ({
    ...item,
    grossTotal: calculation.lines[index]!.grossTotal,
    allocatedDiscount: calculation.lines[index]!.allocatedDiscount,
    paidTotal: calculation.lines[index]!.paidTotal,
    eligible: calculation.lines[index]!.eligible,
    eligibleAmount: calculation.lines[index]!.eligibleAmount,
    exclusionReason: calculation.lines[index]!.exclusionReason,
  }));
  const pointsEarned =
    customer?.status === "active" ? calculation.pointsEarned : 0;

  return {
    channel: "online",
    saleChannelDetail: "online_tuu",
    items: calculatedItems,
    subtotal: total,
    discount: 0,
    total,
    eligibleTotal: calculation.eligibleTotal,
    excludedTotal: calculation.excludedTotal,
    currency: "CLP",
    pointsEarned,
    rule: ruleSnapshot,
    calculationVersion: calculation.calculationVersion,
    customer:
      customer && input.customerEmail
        ? {
            loyaltyCustomerId: customer.id,
            shopifyCustomerId: customer.shopify_customer_id ?? undefined,
            email: input.customerEmail.trim().toLowerCase(),
            marketingConsent: customer.metadata.marketing_consent === true,
          }
        : input.customerEmail
          ? {
              email: input.customerEmail.trim().toLowerCase(),
              marketingConsent: false,
            }
          : undefined,
  };
}

export async function startOnlinePayment(input: {
  requestId?: string;
  items: Array<{ variantId: string; quantity: number }>;
  customerEmail?: string;
}) {
  const requestId = input.requestId?.trim() || randomUUID();

  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    throw new Error("La clave idempotente del pago no es valida");
  }

  const snapshot = await prepareOnlineSale(input);
  const olffyReference = `OLFFY-${requestId}`;
  const idempotencyKey = `tuu_online:${olffyReference}`;
  const paymentEvent = await createPendingPaymentEvent({
    idempotencyKey,
    olffyReference,
    expectedTotal: snapshot.total,
    paymentReference: olffyReference,
    snapshot,
  });
  const previousUrl = (paymentEvent.payload_snapshot as Record<string, unknown>)
    .tuu_payment_url;

  if (typeof previousUrl === "string" && previousUrl) {
    return {
      idempotencyKey,
      olffyReference,
      paymentReference: paymentEvent.payment_reference,
      paymentUrl: previousUrl,
      reused: true,
    };
  }

  const intent = await createTuuOnlineIntent({
    olffyReference,
    amount: snapshot.total,
    currency: "CLP",
    customerEmail: snapshot.customer?.email,
    description: `Compra OLFFY ${olffyReference}`,
  });
  await updatePaymentProviderReference({
    idempotencyKey,
    paymentReference: intent.paymentReference,
    providerEventId: intent.providerEventId,
    paymentUrl: intent.paymentUrl,
  });

  return {
    idempotencyKey,
    olffyReference,
    paymentReference: intent.paymentReference,
    paymentUrl: intent.paymentUrl,
    reused: false,
  };
}

export async function recoverOnlinePayment(idempotencyKey: string) {
  return getPendingPaymentEvent(idempotencyKey);
}
