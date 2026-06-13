import "server-only";

import { redeemReward } from "lib/loyalty/service";
import { getSupabaseServer } from "lib/supabase/server";
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

  return redeemReward({
    customerId: input.customer.id,
    rewardId: Number(reward.id),
    createdBy: `customer:${input.userId}`,
    metadata: {
      channel: "customer_dashboard",
      customer_request_id: input.requestId,
    },
  });
}
