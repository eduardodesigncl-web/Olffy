import "server-only";

import { calculatePointsToKeepAfterRefund } from "./calculation";
import { addPointsTransaction, getCustomerBalance } from "lib/loyalty/service";
import { getSupabaseAdmin } from "lib/supabase/admin";

export type ShopifyRefundEvent = {
  orderGid: string;
  /** ID del refund (o "cancelled" para anulación completa de la orden). */
  refundId: string;
  refundedAmount: number;
  fullCancellation: boolean;
  reason?: string;
  returnedLines?: Array<{
    productId?: string;
    variantId?: string;
    quantity: number;
    refundedAmount: number;
  }>;
};

type EarnedTransaction = {
  id: number;
  customer_id: number;
  points: number;
  source: "physical_sale" | "shopify_order";
  external_reference: string | null;
  rule_id?: number | null;
};

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

async function saveRefundEvent(
  event: ShopifyRefundEvent,
  values: {
    eligibleRefundedAmount: number;
    status: "processing" | "processed";
    pointsReversed?: number;
    reversalTransactionId?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await getSupabaseAdmin()
    .from("loyalty_refund_events")
    .upsert(
      {
        shopify_order_id: event.orderGid,
        refund_id: event.refundId,
        refunded_amount: event.refundedAmount,
        eligible_refunded_amount: values.eligibleRefundedAmount,
        points_reversed: values.pointsReversed ?? 0,
        reversal_transaction_id: values.reversalTransactionId ?? null,
        status: values.status,
        metadata: {
          full_cancellation: event.fullCancellation,
          reason: event.reason ?? null,
          ...(values.metadata ?? {}),
        },
      },
      { onConflict: "shopify_order_id,refund_id" },
    );

  if (error) fail("No se pudo guardar el evento de devolución", error);
}

// Busca la transacción earned asociada a una orden Shopify, tanto para ventas
// online (loyalty:{order}:earned) como físicas (physical_sale:{id}:earned).
async function findEarnedTransaction(
  orderGid: string,
): Promise<EarnedTransaction | null> {
  const supabase = getSupabaseAdmin();
  const { data: online, error: onlineError } = await supabase
    .from("loyalty_transactions")
    .select("id, customer_id, points, source, external_reference, rule_id")
    .eq("source", "shopify_order")
    .eq("external_reference", `loyalty:${orderGid}:earned`)
    .maybeSingle();

  if (onlineError) {
    fail("No se pudo buscar los puntos de la orden", onlineError);
  }
  if (online) return online as EarnedTransaction;

  const { data: sale, error: saleError } = await supabase
    .from("physical_sales")
    .select("id")
    .eq("shopify_order_id", orderGid)
    .maybeSingle();

  if (saleError) {
    fail("No se pudo buscar la venta física de la orden", saleError);
  }
  if (!sale) return null;

  const { data: physical, error: physicalError } = await supabase
    .from("loyalty_transactions")
    .select("id, customer_id, points, source, external_reference, rule_id")
    .eq("source", "physical_sale")
    .eq("external_reference", `physical_sale:${sale.id}:earned`)
    .maybeSingle();

  if (physicalError) {
    fail("No se pudo buscar los puntos de la venta física", physicalError);
  }

  return (physical as EarnedTransaction | null) ?? null;
}

// Reversa de puntos por devolución/anulación Shopify (S5-04):
// proporcional al monto reembolsado sobre el total pagado, idempotente por
// refund_id y sin borrar historial (movimiento 'reversed' con motivo).
// Si el cliente ya gastó parte del saldo, la reversa se limita al saldo
// disponible y el faltante queda registrado en metadata para revisión.
export async function processShopifyRefundEvent(event: ShopifyRefundEvent) {
  const supabase = getSupabaseAdmin();
  const reversalReference = `loyalty-reversal:${event.orderGid}:${event.refundId}`;

  const { data: existing, error: existingError } = await supabase
    .from("loyalty_transactions")
    .select("id, points, metadata")
    .eq("external_reference", reversalReference)
    .maybeSingle();

  if (existingError) {
    fail("No se pudo verificar la reversa", existingError);
  }
  if (existing) {
    const metadata = (existing.metadata ?? {}) as Record<string, unknown>;
    await saveRefundEvent(event, {
      eligibleRefundedAmount: Number(metadata.eligible_refunded_amount ?? 0),
      status: "processed",
      pointsReversed: Math.abs(Number(existing.points ?? 0)),
      reversalTransactionId: Number(existing.id),
      metadata: { recovered_from_transaction: true },
    });
    return { status: "already_processed" as const, transactionId: existing.id };
  }

  const { data: recordedEvent, error: recordedEventError } = await supabase
    .from("loyalty_refund_events")
    .select("id, status, points_reversed, reversal_transaction_id")
    .eq("shopify_order_id", event.orderGid)
    .eq("refund_id", event.refundId)
    .maybeSingle();

  if (recordedEventError) {
    fail("No se pudo verificar el evento de devolución", recordedEventError);
  }
  if (recordedEvent?.status === "processed") {
    return {
      status: "already_processed" as const,
      transactionId: recordedEvent.reversal_transaction_id ?? undefined,
      pointsReversed: Number(recordedEvent.points_reversed ?? 0),
    };
  }

  const earned = await findEarnedTransaction(event.orderGid);

  if (!earned || earned.points <= 0) {
    await saveRefundEvent(event, {
      eligibleRefundedAmount: 0,
      status: "processed",
      metadata: { result: "no_points" },
    });
    return { status: "no_points" as const };
  }

  const { data: orderRef, error: orderRefError } = await supabase
    .from("olffy_order_refs")
    .select("id, total, eligible_total, loyalty_snapshot")
    .eq("shopify_order_id", event.orderGid)
    .maybeSingle();

  if (orderRefError) {
    fail("No se pudo cargar la operación de la orden", orderRefError);
  }

  // Reversas anteriores de la misma orden (devoluciones parciales sucesivas).
  const { data: previous, error: previousError } = await supabase
    .from("loyalty_transactions")
    .select("points, metadata")
    .eq("customer_id", earned.customer_id)
    .eq("transaction_type", "reversed")
    .like("external_reference", `loyalty-reversal:${event.orderGid}:%`);

  if (previousError) {
    fail("No se pudieron cargar reversas anteriores", previousError);
  }

  const alreadyReversed = (previous ?? []).reduce(
    (sum, row) => sum + Math.abs(Number(row.points ?? 0)),
    0,
  );
  const remaining = Math.max(earned.points - alreadyReversed, 0);

  const snapshot = orderRef?.loyalty_snapshot as {
    eligibleTotal?: number;
    rule?: { spendingUnitClp?: number; pointsPerUnit?: number };
    items?: Array<{
      shopifyProductId?: string;
      shopifyVariantId?: string;
      quantity?: number;
      paidTotal?: number;
      eligibleAmount?: number;
    }>;
  } | null;
  const originalEligibleTotal = Number(
    snapshot?.eligibleTotal ?? orderRef?.eligible_total ?? 0,
  );
  const ruleUnit = Number(snapshot?.rule?.spendingUnitClp ?? 0);
  const rulePoints = Number(snapshot?.rule?.pointsPerUnit ?? 0);

  if (
    !event.fullCancellation &&
    (!snapshot?.items || ruleUnit <= 0 || rulePoints <= 0)
  ) {
    throw new Error(
      "La venta no tiene snapshot histórico suficiente para calcular la devolución",
    );
  }

  const currentEligibleRefund = event.fullCancellation
    ? originalEligibleTotal
    : (event.returnedLines ?? []).reduce((sum, returned) => {
        const original = snapshot?.items?.find(
          (item) =>
            (returned.variantId &&
              item.shopifyVariantId === returned.variantId) ||
            (!returned.variantId &&
              returned.productId &&
              item.shopifyProductId === returned.productId),
        );
        if (!original || Number(original.eligibleAmount ?? 0) <= 0) return sum;
        const originalQuantity = Math.max(Number(original.quantity ?? 1), 1);
        const returnedFraction = Math.min(
          Math.max(returned.quantity / originalQuantity, 0),
          1,
        );
        return (
          sum +
          Math.round(Number(original.eligibleAmount ?? 0) * returnedFraction)
        );
      }, 0);

  await saveRefundEvent(event, {
    eligibleRefundedAmount: currentEligibleRefund,
    status: "processing",
  });

  const { data: refundHistory, error: refundHistoryError } = await supabase
    .from("loyalty_refund_events")
    .select("refund_id, eligible_refunded_amount")
    .eq("shopify_order_id", event.orderGid)
    .eq("status", "processed")
    .neq("refund_id", event.refundId);

  if (refundHistoryError) {
    fail("No se pudo cargar el historial de devoluciones", refundHistoryError);
  }

  const recordedRefundIds = new Set(
    (refundHistory ?? []).map((row) => String(row.refund_id)),
  );
  const ledgerEligible = (refundHistory ?? []).reduce(
    (sum, row) => sum + Number(row.eligible_refunded_amount ?? 0),
    0,
  );
  // Compatibilidad con reversas creadas antes de existir el ledger.
  const legacyEligible = (previous ?? []).reduce((sum, row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const refundId = String(metadata.refund_id ?? "");
    return recordedRefundIds.has(refundId)
      ? sum
      : sum + Number(metadata.eligible_refunded_amount ?? 0);
  }, 0);
  const previouslyRefundedEligible = ledgerEligible + legacyEligible;
  const cumulativeEligibleRefund = Math.min(
    originalEligibleTotal,
    previouslyRefundedEligible + currentEligibleRefund,
  );
  const pointsToKeep = event.fullCancellation
    ? 0
    : calculatePointsToKeepAfterRefund({
        originalEligibleTotal,
        cumulativeEligibleRefund,
        rule: { spendingUnitClp: ruleUnit, pointsPerUnit: rulePoints },
      });
  const proportional = Math.min(
    remaining,
    Math.max(earned.points - alreadyReversed - pointsToKeep, 0),
  );

  if (remaining <= 0) {
    await saveRefundEvent(event, {
      eligibleRefundedAmount: currentEligibleRefund,
      status: "processed",
      metadata: {
        result: "nothing_remaining",
        cumulative_eligible_refunded_amount: cumulativeEligibleRefund,
      },
    });
    return { status: "nothing_remaining" as const };
  }

  if (proportional <= 0) {
    await saveRefundEvent(event, {
      eligibleRefundedAmount: currentEligibleRefund,
      status: "processed",
      metadata: {
        result: "nothing_to_reverse",
        cumulative_eligible_refunded_amount: cumulativeEligibleRefund,
        points_purchase_should_keep: pointsToKeep,
      },
    });
    return { status: "nothing_to_reverse" as const };
  }

  // El ledger no permite saldo negativo: si el cliente ya usó los puntos,
  // se reversa lo disponible y el faltante queda trazado para revisión.
  const balance = await getCustomerBalance(earned.customer_id);
  const pointsToReverse = Math.min(proportional, balance);
  const shortfall = proportional - pointsToReverse;

  if (pointsToReverse <= 0) {
    await supabase.from("audit_log").insert({
      entity_type: "loyalty_customer",
      entity_id: String(earned.customer_id),
      action: "refund_reversal_blocked",
      actor: "system:shopify_refund",
      new_data: {
        order_id: event.orderGid,
        refund_id: event.refundId,
        points_pending_reversal: proportional,
        reason: "El cliente no tiene saldo suficiente para la reversa",
      },
    });

    await saveRefundEvent(event, {
      eligibleRefundedAmount: currentEligibleRefund,
      status: "processed",
      metadata: {
        result: "insufficient_balance",
        cumulative_eligible_refunded_amount: cumulativeEligibleRefund,
        points_pending_reversal: proportional,
      },
    });

    return { status: "insufficient_balance" as const, shortfall: proportional };
  }

  const transaction = await addPointsTransaction({
    customerId: earned.customer_id,
    transactionType: "reversed",
    points: -pointsToReverse,
    source: earned.source,
    externalReference: reversalReference,
    description: event.fullCancellation
      ? "Reversa de puntos por anulación de la orden"
      : "Reversa de puntos por devolución",
    createdBy: "system:shopify_refund",
    metadata: {
      order_id: event.orderGid,
      refund_id: event.refundId,
      refunded_amount: event.refundedAmount,
      eligible_refunded_amount: currentEligibleRefund,
      cumulative_eligible_refunded_amount: cumulativeEligibleRefund,
      points_purchase_should_keep: pointsToKeep,
      original_transaction_id: earned.id,
      reason: event.reason ?? null,
      shortfall_points: shortfall > 0 ? shortfall : undefined,
    },
    ruleId: earned.rule_id ?? undefined,
  });

  await saveRefundEvent(event, {
    eligibleRefundedAmount: currentEligibleRefund,
    status: "processed",
    pointsReversed: pointsToReverse,
    reversalTransactionId: transaction.id,
    metadata: {
      result: "processed",
      cumulative_eligible_refunded_amount: cumulativeEligibleRefund,
      points_purchase_should_keep: pointsToKeep,
      shortfall_points: shortfall,
    },
  });

  await supabase.from("audit_log").insert({
    entity_type: "loyalty_customer",
    entity_id: String(earned.customer_id),
    action: "points_reversed_refund",
    actor: "system:shopify_refund",
    new_data: {
      order_id: event.orderGid,
      refund_id: event.refundId,
      points_reversed: pointsToReverse,
      shortfall_points: shortfall,
      transaction_id: transaction.id,
    },
  });

  return {
    status: "processed" as const,
    transactionId: transaction.id,
    pointsReversed: pointsToReverse,
    shortfall,
  };
}
