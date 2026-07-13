import "server-only";

import { addPointsTransaction } from "lib/loyalty/service";
import { createOrFindPaidOlffyOrder } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { issueOrderBoleta } from "./dte";
import { enqueueOrderMarketingEvents } from "./marketing";
import {
  claimPaymentEvent,
  completePaymentEvent,
  failPaymentEvent,
  findOrderReference,
  updateOrderReference,
  upsertOrderReference,
} from "./repository";
import type { PaidSaleSnapshot } from "./types";

async function processOnlinePoints(input: {
  snapshot: PaidSaleSnapshot;
  shopifyOrderId: string;
}) {
  const customerId = input.snapshot.customer?.loyaltyCustomerId;
  const points = input.snapshot.pointsEarned;

  if (!customerId || points <= 0) {
    return { status: "skipped" as const, transactionId: undefined };
  }

  const externalReference = `loyalty:${input.shopifyOrderId}:earned`;
  const { data: existing, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .select("id")
    .eq("source", "shopify_order")
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar los puntos: ${error.message}`);
  }

  if (existing) {
    return { status: "processed" as const, transactionId: Number(existing.id) };
  }

  const transaction = await addPointsTransaction({
    customerId,
    transactionType: "earned",
    points,
    source: "shopify_order",
    externalReference,
    description: "Puntos por compra online OLFFY",
    createdBy: "system:tuu_callback",
    metadata: { shopify_order_id: input.shopifyOrderId },
    ruleId: input.snapshot.rule.id,
  });

  return { status: "processed" as const, transactionId: transaction.id };
}

export async function completeTuuOnlinePayment(input: {
  olffyReference: string;
  providerEventId?: string;
  paymentReference: string;
  amount: number;
  currency: string;
}) {
  const idempotencyKey = `tuu_online:${input.olffyReference}`;
  const claim = await claimPaymentEvent({
    idempotencyKey,
    providerEventId: input.providerEventId,
    receivedTotal: input.amount,
    currency: input.currency,
  });

  if (claim.status === "manual_review") {
    throw new Error("El monto o moneda del callback TUU no coincide");
  }

  if (claim.already_completed === true) {
    return {
      alreadyCompleted: true,
      orderRef: await findOrderReference(input.olffyReference),
    };
  }

  if (claim.in_progress === true) {
    return { inProgress: true };
  }

  const claimToken = String(claim.claim_token ?? "");
  const snapshot = claim.payload_snapshot as PaidSaleSnapshot;

  try {
    const shopifyOrder = await createOrFindPaidOlffyOrder({
      tuuTransactionId: input.paymentReference,
      olffyReference: input.olffyReference,
      channel: "online",
      saleChannelDetail: snapshot.saleChannelDetail,
      responsible: "TUU online callback",
      customer: snapshot.customer
        ? {
            email: snapshot.customer.email,
            shopifyCustomerId: snapshot.customer.shopifyCustomerId,
          }
        : undefined,
      items: snapshot.items.map((item) => ({
        variantId: item.shopifyVariantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      total: snapshot.total,
      metafields: [
        {
          namespace: "olffy",
          key: "loyalty_points_earned",
          value: String(snapshot.pointsEarned),
        },
        {
          namespace: "olffy",
          key: "loyalty_eligible_total",
          value: String(snapshot.eligibleTotal),
        },
      ],
    });
    const orderRef = await upsertOrderReference({
      olffyReference: input.olffyReference,
      snapshot,
      paymentReference: input.paymentReference,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderName: shopifyOrder.name,
    });
    await issueOrderBoleta(orderRef);
    const loyalty = await processOnlinePoints({
      snapshot,
      shopifyOrderId: shopifyOrder.id,
    });
    await updateOrderReference(orderRef.id, {
      loyalty_status: loyalty.status,
    });
    await enqueueOrderMarketingEvents({
      orderRef,
      snapshot,
      pointsEarned: snapshot.pointsEarned,
      loyaltyTransactionId: loyalty.transactionId,
    });
    await completePaymentEvent({ idempotencyKey, claimToken });

    return { alreadyCompleted: false, orderRef };
  } catch (cause) {
    await failPaymentEvent({
      idempotencyKey,
      claimToken,
      status: "manual_review",
      error: cause instanceof Error ? cause.message : "Error desconocido",
    });
    throw cause;
  }
}

export async function finalizePhysicalOperation(input: {
  olffyReference: string;
  paymentReference: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  physicalSaleId: number;
  snapshot: PaidSaleSnapshot;
}) {
  const orderRef = await upsertOrderReference({
    olffyReference: input.olffyReference,
    snapshot: input.snapshot,
    paymentReference: input.paymentReference,
    shopifyOrderId: input.shopifyOrderId,
    shopifyOrderName: input.shopifyOrderName,
    physicalSaleId: input.physicalSaleId,
  });
  await updateOrderReference(orderRef.id, {
    loyalty_status:
      input.snapshot.customer && input.snapshot.pointsEarned > 0
        ? "processed"
        : "skipped",
  });
  await issueOrderBoleta(orderRef);
  await enqueueOrderMarketingEvents({
    orderRef,
    snapshot: input.snapshot,
    pointsEarned: input.snapshot.pointsEarned,
  });

  return orderRef;
}
