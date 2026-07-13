import { expireGuestLoyaltyClaims } from "lib/loyalty/guest-claims";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { enqueueLoyaltyEmailEvent } from "lib/transactions/marketing";
import { NextResponse } from "next/server";
import { expireUnusedStorefrontRewardRedemptions } from "lib/loyalty/redemptions";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

// Expira por lote los puntos vencidos (regla OLFFY Puntos: 6 meses desde la
// acumulación, consumo FIFO). Idempotente: si no hay remanentes vencidos no
// inserta movimientos.
async function runExpiration() {
  const { data, error } = await getSupabaseAdmin().rpc("expire_loyalty_points");

  if (error) {
    throw new Error(`No se pudieron expirar los puntos: ${error.message}`);
  }

  const claims = await expireGuestLoyaltyClaims().catch((cause) => {
    console.error("No se pudieron expirar reclamaciones de invitado:", cause);
    return { error: cause instanceof Error ? cause.message : "error" };
  });

  const reminders = await enqueueExpiryReminders().catch((cause) => {
    console.error("No se pudieron encolar recordatorios:", cause);
    return { error: cause instanceof Error ? cause.message : "error" };
  });

  const cartRedemptions = await expireUnusedStorefrontRewardRedemptions().catch(
    (cause) => {
      console.error("No se pudieron expirar canjes de carrito:", cause);
      return { error: cause instanceof Error ? cause.message : "error" };
    },
  );

  return {
    ...(data as Record<string, unknown>),
    guest_claims: claims,
    reminders,
    cart_redemptions: cartRedemptions,
  };
}

// Recordatorios de fidelización (idempotentes por evento en el outbox):
// 1. Reclamaciones de invitado que vencen en los próximos 3 días.
// 2. Puntos confirmados que vencen en los próximos 14 días (aviso al cliente).
async function enqueueExpiryReminders() {
  const supabase = getSupabaseAdmin();
  let claimReminders = 0;
  let pointReminders = 0;

  const claimDeadline = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: expiringClaims, error: claimsError } = await supabase
    .from("loyalty_pending_claims")
    .select("id, email, points, expires_at")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .lte("expires_at", claimDeadline)
    .limit(200);

  if (claimsError) {
    throw new Error(
      `No se pudieron cargar reclamaciones por vencer: ${claimsError.message}`,
    );
  }

  for (const claim of expiringClaims ?? []) {
    await enqueueLoyaltyEmailEvent({
      eventType: "Guest Claim Expiring Soon",
      entityId: claim.id,
      email: String(claim.email),
      payload: {
        pending_claim_id: claim.id,
        points: claim.points,
        expires_at: claim.expires_at,
      },
    });
    claimReminders += 1;
  }

  const pointsDeadline = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: lotCustomers, error: lotsError } = await supabase
    .from("loyalty_transactions")
    .select("customer_id")
    .gt("points", 0)
    .gt("expires_at", new Date().toISOString())
    .lte("expires_at", pointsDeadline)
    .limit(500);

  if (lotsError) {
    throw new Error(
      `No se pudieron cargar lotes por vencer: ${lotsError.message}`,
    );
  }

  const customerIds = [
    ...new Set((lotCustomers ?? []).map((row) => Number(row.customer_id))),
  ];

  for (const customerId of customerIds) {
    const { data: expiring, error: expiringError } = await supabase.rpc(
      "get_expiring_loyalty_points",
      { p_customer_id: customerId, p_within_days: 14 },
    );

    if (expiringError) {
      console.error(
        "No se pudieron calcular puntos por vencer:",
        expiringError.message,
      );
      continue;
    }

    const result = (expiring ?? {}) as Record<string, unknown>;
    const points = Number(result.expiring_points ?? 0);
    const nextExpiry =
      typeof result.next_expiry === "string" ? result.next_expiry : null;

    if (points <= 0 || !nextExpiry) continue;

    const { data: customer } = await supabase
      .from("loyalty_customers")
      .select("email")
      .eq("id", customerId)
      .maybeSingle();

    if (!customer?.email) continue;

    await enqueueLoyaltyEmailEvent({
      eventType: "Points Expiring Soon",
      // Idempotente por cliente y fecha de vencimiento del lote más próximo.
      entityId: `${customerId}:${nextExpiry.slice(0, 10)}`,
      email: String(customer.email),
      loyaltyCustomerId: customerId,
      payload: {
        expiring_points: points,
        next_expiry: nextExpiry,
      },
    });
    pointReminders += 1;
  }

  return { claim_reminders: claimReminders, point_reminders: pointReminders };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runExpiration());
  } catch (cause) {
    console.error("Error expiring loyalty points:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudieron expirar los puntos",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
