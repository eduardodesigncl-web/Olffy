import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "lib/supabase/admin";
import type { OrderReference, PaidSaleSnapshot } from "lib/transactions/types";

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export function saleFingerprint(snapshot: PaidSaleSnapshot): string {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export async function createPendingPaymentEvent(input: {
  idempotencyKey: string;
  olffyReference: string;
  expectedTotal: number;
  paymentReference: string;
  snapshot: PaidSaleSnapshot;
}) {
  const fingerprint = saleFingerprint(input.snapshot);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payment_events")
    .insert({
      provider: "tuu",
      event_type: "online_payment",
      idempotency_key: input.idempotencyKey,
      payment_reference: input.paymentReference,
      olffy_reference: input.olffyReference,
      expected_total: input.expectedTotal,
      currency: "CLP",
      payload_fingerprint: fingerprint,
      payload_snapshot: input.snapshot,
    })
    .select("*")
    .maybeSingle();

  if (!error) {
    return data;
  }

  if (error.code !== "23505") {
    fail("No se pudo reservar el pago TUU", error);
  }

  const { data: existing, error: existingError } = await supabase
    .from("payment_events")
    .select("*")
    .eq("idempotency_key", input.idempotencyKey)
    .single();

  if (existingError) {
    fail("No se pudo recuperar el pago TUU", existingError);
  }

  if (
    existing.payload_fingerprint !== fingerprint ||
    Number(existing.expected_total) !== input.expectedTotal
  ) {
    throw new Error(
      "La clave idempotente ya fue utilizada con un carrito diferente",
    );
  }

  return existing;
}

export async function updatePaymentProviderReference(input: {
  idempotencyKey: string;
  paymentReference: string;
  providerEventId?: string;
  paymentUrl: string;
}) {
  const { data: current, error: currentError } = await getSupabaseAdmin()
    .from("payment_events")
    .select("payload_snapshot")
    .eq("idempotency_key", input.idempotencyKey)
    .single();

  if (currentError) {
    fail("No se pudo cargar el intento de pago", currentError);
  }

  const { error } = await getSupabaseAdmin()
    .from("payment_events")
    .update({
      payment_reference: input.paymentReference,
      provider_event_id: input.providerEventId ?? null,
      payload_snapshot: {
        ...(current.payload_snapshot as Record<string, unknown>),
        tuu_payment_url: input.paymentUrl,
      },
    })
    .eq("idempotency_key", input.idempotencyKey);

  if (error) {
    fail("No se pudo guardar la referencia TUU", error);
  }
}

export async function getPendingPaymentEvent(idempotencyKey: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("payment_events")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (error) {
    fail("No se pudo cargar el pago TUU", error);
  }

  return data;
}

export async function claimPaymentEvent(input: {
  idempotencyKey: string;
  providerEventId?: string;
  receivedTotal: number;
  currency: string;
}) {
  const { data, error } = await getSupabaseAdmin().rpc("claim_payment_event", {
    p_idempotency_key: input.idempotencyKey,
    p_provider_event_id: input.providerEventId ?? "",
    p_received_total: input.receivedTotal,
    p_currency: input.currency,
    p_lease_seconds: 180,
  });

  if (error) {
    fail("No se pudo reclamar el callback TUU", error);
  }

  return data as Record<string, unknown>;
}

export async function completePaymentEvent(input: {
  idempotencyKey: string;
  claimToken: string;
}) {
  const { error } = await getSupabaseAdmin().rpc("complete_payment_event", {
    p_idempotency_key: input.idempotencyKey,
    p_claim_token: input.claimToken,
  });

  if (error) {
    fail("No se pudo completar el evento de pago", error);
  }
}

export async function failPaymentEvent(input: {
  idempotencyKey: string;
  claimToken: string;
  status: "rejected" | "manual_review";
  error: string;
}) {
  const { error } = await getSupabaseAdmin().rpc("fail_payment_event", {
    p_idempotency_key: input.idempotencyKey,
    p_claim_token: input.claimToken,
    p_status: input.status,
    p_error: input.error,
  });

  if (error) {
    console.error("No se pudo marcar el callback TUU como fallido:", error);
  }
}

export async function upsertOrderReference(input: {
  olffyReference: string;
  snapshot: PaidSaleSnapshot;
  paymentReference: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  physicalSaleId?: number;
}) {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .upsert(
      {
        olffy_reference: input.olffyReference,
        channel: input.snapshot.channel,
        sale_channel_detail: input.snapshot.saleChannelDetail,
        shopify_order_id: input.shopifyOrderId,
        shopify_order_name: input.shopifyOrderName ?? null,
        shopify_customer_id: input.snapshot.customer?.shopifyCustomerId ?? null,
        customer_email: input.snapshot.customer?.email ?? null,
        loyalty_customer_id: input.snapshot.customer?.loyaltyCustomerId ?? null,
        physical_sale_id: input.physicalSaleId ?? null,
        payment_provider: "tuu",
        payment_reference: input.paymentReference,
        payment_status: "confirmed",
        total: input.snapshot.total,
        currency: input.snapshot.currency,
        points_earned: input.snapshot.pointsEarned,
        eligible_total: input.snapshot.eligibleTotal,
        excluded_total: input.snapshot.excludedTotal,
        rule_id: input.snapshot.rule.id,
        spending_unit_clp: input.snapshot.rule.spendingUnitClp,
        points_per_unit: input.snapshot.rule.pointsPerUnit,
        calculation_version: input.snapshot.calculationVersion,
        loyalty_snapshot: input.snapshot,
        metadata: {
          subtotal: input.snapshot.subtotal,
          discount: input.snapshot.discount,
          eligible_total: input.snapshot.eligibleTotal,
          excluded_total: input.snapshot.excludedTotal,
          rule: input.snapshot.rule,
          calculation_version: input.snapshot.calculationVersion,
          items: input.snapshot.items,
        },
      },
      { onConflict: "olffy_reference" },
    )
    .select("*")
    .single();

  if (error) {
    fail("No se pudo guardar la referencia de orden", error);
  }

  if (input.physicalSaleId) {
    const { error: saleError } = await getSupabaseAdmin()
      .from("physical_sales")
      .update({ order_ref_id: data.id })
      .eq("id", input.physicalSaleId);

    if (saleError) {
      fail("No se pudo enlazar la venta fisica", saleError);
    }
  }

  return data as OrderReference;
}

export async function updateOrderReference(
  id: string,
  changes: Partial<
    Pick<
      OrderReference,
      "tax_status" | "loyalty_status" | "marketing_status" | "last_error"
    >
  >,
) {
  const { error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .update(changes)
    .eq("id", id);

  if (error) {
    fail("No se pudo actualizar la operacion OLFFY", error);
  }
}

export async function findOrderReference(olffyReference: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .eq("olffy_reference", olffyReference)
    .maybeSingle();

  if (error) {
    fail("No se pudo buscar la operacion OLFFY", error);
  }

  return data as OrderReference | null;
}

export async function listOrderReferences(limit = 100) {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    fail("No se pudieron cargar las operaciones OLFFY", error);
  }

  return (data ?? []) as OrderReference[];
}

export async function getOrderReferenceById(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    fail("No se pudo cargar la operacion OLFFY", error);
  }

  return data as OrderReference;
}
