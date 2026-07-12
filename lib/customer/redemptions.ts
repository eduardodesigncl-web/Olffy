import "server-only";

import { issueAutomaticRewardRedemption } from "lib/loyalty/automatic-redemptions";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getSupabaseServer } from "lib/supabase/server";
import { enqueueCustomerMarketingEvent } from "lib/transactions/marketing";
import type { CustomerAccount } from "./auth";

export async function requestCustomerReward(input: {
  customer: CustomerAccount;
  userId: string;
  rewardId: number;
  requestId: string;
}) {
  if (input.customer.status !== "active") {
    throw new Error("La cuenta esta bloqueada y no puede solicitar canjes.");
  }

  const supabase = await getSupabaseServer();
  const { data: reward, error } = await supabase
    .from("rewards")
    .select("id, points_cost, is_active")
    .eq("id", input.rewardId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar la recompensa: ${error.message}`);
  }

  if (!reward) {
    throw new Error("La recompensa ya no esta disponible.");
  }

  if (Number(reward.points_cost) > input.customer.points_balance) {
    throw new Error("No tienes puntos suficientes para esta recompensa.");
  }

  const actor = `customer:${input.userId}`;
  const result = await issueAutomaticRewardRedemption({
    customerId: input.customer.id,
    rewardId: Number(reward.id),
    createdBy: actor,
    metadata: {
      channel: "customer_dashboard",
      customer_request_id: input.requestId,
    },
  });
  try {
    const { data: profile } = await getSupabaseAdmin()
      .from("loyalty_customers")
      .select("metadata, shopify_customer_id")
      .eq("id", input.customer.id)
      .single();

    await enqueueCustomerMarketingEvent({
      eventType: "Reward Redeemed",
      entityId: result.redemptionId,
      loyaltyCustomerId: input.customer.id,
      email: input.customer.email,
      shopifyCustomerId: profile?.shopify_customer_id ?? undefined,
      marketingConsent: profile?.metadata?.marketing_consent === true,
      relatedLoyaltyTransactionId: result.transactionId,
      payload: {
        redemption_id: result.redemptionId,
        reward_id: input.rewardId,
        points_balance: input.customer.points_balance,
      },
    });
  } catch (marketingError) {
    console.error(
      "El canje se completo, pero no se pudo encolar marketing:",
      marketingError,
    );
  }

  return result;
}
