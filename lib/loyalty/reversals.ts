import "server-only";

import { addPointsTransaction, getCustomerBalance } from "lib/loyalty/service";
import { getSupabaseAdmin } from "lib/supabase/admin";

export type ShopifyRefundEvent = {
  orderGid: string;
  /** ID del refund (o "cancelled" para anulación completa de la orden). */
  refundId: string;
  refundedAmount: number;
  fullCancellation: boolean;
  reason?: string;
};

type EarnedTransaction = {
  id: number;
  customer_id: number;
  points: number;
  source: "physical_sale" | "shopify_order";
  external_reference: string | null;
};

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

// Busca la transacción earned asociada a una orden Shopify, tanto para ventas
// online (loyalty:{order}:earned) como físicas (physical_sale:{id}:earned).
async function findEarnedTransaction(
  orderGid: string,
): Promise<EarnedTransaction | null> {
  const supabase = getSupabaseAdmin();
  const { data: online, error: onlineError } = await supabase
    .from("loyalty_transactions")
    .select("id, customer_id, points, source, external_reference")
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
    .select("id, customer_id, points, source, external_reference")
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
    .select("id")
    .eq("external_reference", reversalReference)
    .maybeSingle();

  if (existingError) {
    fail("No se pudo verificar la reversa", existingError);
  }
  if (existing) {
    return { status: "already_processed" as const, transactionId: existing.id };
  }

  const earned = await findEarnedTransaction(event.orderGid);

  if (!earned || earned.points <= 0) {
    return { status: "no_points" as const };
  }

  const { data: orderRef, error: orderRefError } = await supabase
    .from("olffy_order_refs")
    .select("id, total")
    .eq("shopify_order_id", event.orderGid)
    .maybeSingle();

  if (orderRefError) {
    fail("No se pudo cargar la operación de la orden", orderRefError);
  }

  // Reversas anteriores de la misma orden (devoluciones parciales sucesivas).
  const { data: previous, error: previousError } = await supabase
    .from("loyalty_transactions")
    .select("points")
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

  if (remaining <= 0) {
    return { status: "nothing_remaining" as const };
  }

  const paidBase = Number(orderRef?.total ?? 0);
  const proportional =
    event.fullCancellation || paidBase <= 0
      ? remaining
      : Math.min(
          remaining,
          Math.round((earned.points * event.refundedAmount) / paidBase),
        );

  if (proportional <= 0) {
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
      original_transaction_id: earned.id,
      reason: event.reason ?? null,
      shortfall_points: shortfall > 0 ? shortfall : undefined,
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
