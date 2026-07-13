import "server-only";

import { getMarketingProvider } from "lib/marketing/provider";
import { getSupabaseAdmin } from "lib/supabase/admin";
import type { OrderReference, PaidSaleSnapshot } from "./types";
import { updateOrderReference } from "./repository";

export async function enqueueOrderMarketingEvents(input: {
  orderRef: OrderReference;
  snapshot: PaidSaleSnapshot;
  pointsEarned: number;
  loyaltyTransactionId?: number;
}) {
  const customer = input.snapshot.customer;

  if (!customer?.email || !customer.marketingConsent) {
    await updateOrderReference(input.orderRef.id, {
      marketing_status: "skipped",
    });
    return;
  }

  const provider =
    process.env.MARKETING_PROVIDER?.trim().toLowerCase() || "noop";
  const events: Array<{ eventType: string; entityId: string }> = [
    {
      eventType:
        input.snapshot.channel === "physical"
          ? "Physical Purchase Completed"
          : "Purchase Completed",
      entityId: input.orderRef.id,
    },
    ...(input.pointsEarned > 0
      ? [
          {
            eventType: "Points Earned",
            entityId:
              input.loyaltyTransactionId?.toString() ?? input.orderRef.id,
          },
        ]
      : []),
  ];

  if (customer.loyaltyCustomerId && input.pointsEarned > 0) {
    const { data: loyaltyCustomer } = await getSupabaseAdmin()
      .from("loyalty_customers")
      .select("points_balance")
      .eq("id", customer.loyaltyCustomerId)
      .single();
    const balance = Number(loyaltyCustomer?.points_balance ?? 0);
    const previousBalance = Math.max(balance - input.pointsEarned, 0);
    const { data: newlyAvailableReward } = await getSupabaseAdmin()
      .from("rewards")
      .select("id")
      .eq("is_active", true)
      .gt("points_cost", previousBalance)
      .lte("points_cost", balance)
      .order("points_cost", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (newlyAvailableReward) {
      events.push({
        eventType: "Reward Available",
        entityId: `${customer.loyaltyCustomerId}:${newlyAvailableReward.id}`,
      });
    }
  }

  for (const event of events) {
    const { error } = await getSupabaseAdmin()
      .from("marketing_event_outbox")
      .upsert(
        {
          event_type: event.eventType,
          idempotency_key: `marketing:${event.eventType}:${event.entityId}`,
          shopify_customer_id: customer.shopifyCustomerId ?? null,
          loyalty_customer_id: customer.loyaltyCustomerId ?? null,
          email: customer.email,
          related_order_ref_id: input.orderRef.id,
          related_loyalty_transaction_id: input.loyaltyTransactionId ?? null,
          payload_minimal: {
            olffy_reference: input.orderRef.olffy_reference,
            shopify_order_name: input.orderRef.shopify_order_name,
            total: input.orderRef.total,
            currency: input.orderRef.currency,
            points_earned: input.pointsEarned,
          },
          provider,
        },
        { onConflict: "idempotency_key", ignoreDuplicates: true },
      );

    if (error) {
      throw new Error(
        `No se pudo encolar el evento de marketing: ${error.message}`,
      );
    }
  }

  await updateOrderReference(input.orderRef.id, {
    marketing_status: "pending",
  });
}

export async function enqueueCustomerMarketingEvent(input: {
  eventType: string;
  entityId: string | number;
  loyaltyCustomerId: number;
  email: string;
  shopifyCustomerId?: string;
  marketingConsent: boolean;
  relatedLoyaltyTransactionId?: number;
  payload: Record<string, unknown>;
}) {
  if (!input.marketingConsent) return;

  const provider =
    process.env.MARKETING_PROVIDER?.trim().toLowerCase() || "noop";
  const { error } = await getSupabaseAdmin()
    .from("marketing_event_outbox")
    .upsert(
      {
        event_type: input.eventType,
        idempotency_key: `marketing:${input.eventType}:${input.entityId}`,
        shopify_customer_id: input.shopifyCustomerId ?? null,
        loyalty_customer_id: input.loyaltyCustomerId,
        email: input.email,
        related_loyalty_transaction_id:
          input.relatedLoyaltyTransactionId ?? null,
        payload_minimal: input.payload,
        provider,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(
      `No se pudo encolar el evento de marketing: ${error.message}`,
    );
  }
}

// Correos de fidelización (transaccionales del programa: invitación a
// reclamar puntos, activación, recordatorios de vencimiento). A diferencia de
// los eventos de marketing, no dependen del consentimiento comercial: son
// avisos operativos del beneficio del propio cliente. El envío real ocurre
// mediante el proveedor configurado (Klaviyo en producción) y es idempotente
// por evento.
export async function enqueueLoyaltyEmailEvent(input: {
  eventType: string;
  entityId: string | number;
  email: string;
  loyaltyCustomerId?: number | null;
  payload: Record<string, unknown>;
}) {
  const email = input.email.trim().toLowerCase();

  if (!email) return;

  const provider =
    process.env.MARKETING_PROVIDER?.trim().toLowerCase() || "noop";
  const { error } = await getSupabaseAdmin()
    .from("marketing_event_outbox")
    .upsert(
      {
        event_type: input.eventType,
        idempotency_key: `loyalty:${input.eventType}:${input.entityId}`,
        loyalty_customer_id: input.loyaltyCustomerId ?? null,
        email,
        payload_minimal: input.payload,
        provider,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(
      `No se pudo encolar el correo de fidelización: ${error.message}`,
    );
  }
}

export async function enqueueConsentedCustomerProfileSync(limit = 500) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("loyalty_customers")
    .select("id,email,shopify_customer_id,points_balance,metadata")
    .not("email", "is", null)
    .contains("metadata", { marketing_consent: true })
    .order("id", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 1000));

  if (error) {
    throw new Error(`No se pudieron leer los contactos: ${error.message}`);
  }

  const rows = (data ?? [])
    .filter((customer) => Boolean(customer.email?.trim()))
    .map((customer) => ({
      event_type: "Marketing Profile Sync",
      idempotency_key: `marketing:profile-sync:${customer.id}`,
      shopify_customer_id: customer.shopify_customer_id ?? null,
      loyalty_customer_id: customer.id,
      email: customer.email.trim().toLowerCase(),
      payload_minimal: {
        source: "loyalty_customer",
        points_balance: Number(customer.points_balance ?? 0),
        marketing_consent: true,
      },
      provider: "klaviyo",
    }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("marketing_event_outbox")
      .upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true });
    if (upsertError) {
      throw new Error(
        `No se pudo preparar la sincronización: ${upsertError.message}`,
      );
    }
  }

  return rows.length;
}

export async function getMarketingQueueSummary() {
  const supabase = getSupabaseAdmin();
  const statuses = ["pending", "processing", "processed", "failed"] as const;
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("marketing_event_outbox")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw new Error(error.message);
      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(counts) as Record<
    (typeof statuses)[number],
    number
  >;
}

export async function processMarketingOutbox(limit = 25) {
  const supabase = getSupabaseAdmin();
  const provider = await getMarketingProvider();
  const { data, error } = await supabase.rpc("claim_marketing_events", {
    p_limit: limit,
    p_lease_seconds: 180,
  });

  if (error) {
    throw new Error(`No se pudo reclamar la cola: ${error.message}`);
  }

  let processed = 0;
  let failed = 0;

  for (const row of data ?? []) {
    try {
      await provider.send({
        id: String(row.id),
        eventType: String(row.event_type),
        idempotencyKey: String(row.idempotency_key),
        email: row.email ? String(row.email) : undefined,
        shopifyCustomerId: row.shopify_customer_id
          ? String(row.shopify_customer_id)
          : undefined,
        loyaltyCustomerId: row.loyalty_customer_id
          ? String(row.loyalty_customer_id)
          : undefined,
        payload: (row.payload_minimal ?? {}) as Record<string, unknown>,
      });
      const { error: updateError } = await supabase
        .from("marketing_event_outbox")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          processing_token: null,
          lease_until: null,
          last_error: null,
        })
        .eq("id", row.id)
        .eq("processing_token", row.processing_token);

      if (updateError) throw updateError;
      if (row.related_order_ref_id) {
        const { count } = await supabase
          .from("marketing_event_outbox")
          .select("id", { count: "exact", head: true })
          .eq("related_order_ref_id", row.related_order_ref_id)
          .neq("status", "processed")
          .neq("status", "cancelled");

        if ((count ?? 0) === 0) {
          await updateOrderReference(String(row.related_order_ref_id), {
            marketing_status: "processed",
          });
        }
      }
      processed += 1;
    } catch (cause) {
      failed += 1;
      await supabase
        .from("marketing_event_outbox")
        .update({
          status: "failed",
          processing_token: null,
          lease_until: null,
          last_error:
            cause instanceof Error ? cause.message.slice(0, 2000) : "Error",
        })
        .eq("id", row.id)
        .eq("processing_token", row.processing_token);
    }
  }

  return { claimed: data?.length ?? 0, processed, failed };
}
