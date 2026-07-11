import "server-only";

import { getSupabaseAdmin } from "lib/supabase/admin";
import { enqueueLoyaltyEmailEvent } from "lib/transactions/marketing";

const CLAIM_WINDOW_DAYS = 15;

export type GuestClaimInput = {
  shopifyOrderId: string;
  orderRefId?: string | null;
  email: string;
  points: number;
  eligibleTotal?: number | null;
  purchasedAt: string;
};

// Crea la reclamación pendiente de una compra invitada (idempotente por
// orden). Devuelve true solo cuando la reclamación es nueva, para emitir la
// invitación una única vez.
export async function createGuestPendingClaim(
  input: GuestClaimInput,
): Promise<{ created: boolean; claimId?: number; expiresAt?: string }> {
  const email = input.email.trim().toLowerCase();
  const points = Math.trunc(input.points);

  if (!email || points <= 0) return { created: false };

  const purchasedAt = new Date(input.purchasedAt);
  const expiresAt = new Date(
    purchasedAt.getTime() + CLAIM_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  if (expiresAt.getTime() <= Date.now()) return { created: false };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("loyalty_pending_claims")
    .insert({
      shopify_order_id: input.shopifyOrderId,
      order_ref_id: input.orderRefId ?? null,
      email,
      points,
      eligible_total: input.eligibleTotal ?? null,
      purchased_at: purchasedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("id, expires_at")
    .maybeSingle();

  if (error) {
    // 23505: la orden ya tiene reclamación (reintento de webhook/cron).
    if (error.code === "23505") return { created: false };
    throw new Error(
      `No se pudo crear la reclamación de puntos: ${error.message}`,
    );
  }

  if (!data) return { created: false };

  const { error: eventError } = await supabase.from("email_events").insert({
    event_type: "guest_points_invitation",
    recipient_email: email,
    payload: {
      pending_claim_id: data.id,
      shopify_order_id: input.shopifyOrderId,
      points,
      expires_at: data.expires_at,
      idempotency_key: `guest_points_invitation:${input.shopifyOrderId}`,
    },
  });

  if (eventError) {
    console.error(
      "No se pudo registrar la invitación de puntos:",
      eventError.message,
    );
  }

  try {
    await enqueueLoyaltyEmailEvent({
      eventType: "Guest Points Invitation",
      entityId: data.id,
      email,
      payload: {
        pending_claim_id: data.id,
        shopify_order_id: input.shopifyOrderId,
        points,
        expires_at: data.expires_at,
      },
    });
  } catch (cause) {
    console.error("No se pudo encolar la invitación de puntos:", cause);
  }

  return {
    created: true,
    claimId: Number(data.id),
    expiresAt: String(data.expires_at),
  };
}

// Activa las reclamaciones vigentes de un correo al verificar la cuenta.
export async function claimGuestLoyaltyPoints(
  customerId: number,
  email: string,
): Promise<{ claimed: number; points: number }> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_guest_loyalty_points",
    { p_customer_id: customerId, p_email: email },
  );

  if (error) {
    throw new Error(`No se pudieron reclamar los puntos: ${error.message}`);
  }

  const result = (data ?? {}) as Record<string, unknown>;
  return {
    claimed: Number(result.claimed ?? 0),
    points: Number(result.points ?? 0),
  };
}

export async function expireGuestLoyaltyClaims(): Promise<
  Record<string, unknown>
> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "expire_guest_loyalty_claims",
  );

  if (error) {
    throw new Error(
      `No se pudieron expirar las reclamaciones: ${error.message}`,
    );
  }

  return (data ?? {}) as Record<string, unknown>;
}
