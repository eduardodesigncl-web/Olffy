import "server-only";

import type {
  LoyaltyReward,
  LoyaltyRule,
  LoyaltyTransaction,
  RewardRedemption,
} from "lib/loyalty/service";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getSupabaseServer } from "lib/supabase/server";
import type { CustomerAccount } from "./auth";

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export type CustomerTransaction = Pick<
  LoyaltyTransaction,
  | "id"
  | "customer_id"
  | "transaction_type"
  | "points"
  | "balance_after"
  | "source"
  | "description"
  | "created_at"
>;

export type CustomerReward = Pick<
  LoyaltyReward,
  | "id"
  | "name"
  | "description"
  | "reward_type"
  | "points_cost"
  | "discount_amount_clp"
  | "minimum_purchase_clp"
  | "validity_days"
  | "shopify_product_id"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

export type CustomerRedemption = Pick<
  RewardRedemption,
  | "id"
  | "customer_id"
  | "reward_id"
  | "loyalty_transaction_id"
  | "points_spent"
  | "status"
  | "redemption_code"
  | "shopify_discount_code"
  | "shopify_discount_status"
  | "shopify_discount_ends_at"
  | "shopify_discount_usage_count"
  | "redeemed_at"
  | "expires_at"
  | "fulfilled_at"
  | "cancelled_at"
  | "cancellation_reason"
  | "created_at"
  | "updated_at"
> & {
  rewards: Pick<LoyaltyReward, "name" | "discount_amount_clp"> | null;
};

export type CustomerRule = Pick<
  LoyaltyRule,
  | "id"
  | "name"
  | "spending_unit_clp"
  | "points_per_unit"
  | "point_redemption_value_clp"
  | "points_expiry_months"
  | "redemption_expiry_days"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

export async function getCustomerTransactions(
  customerId: number,
  limit = 50,
): Promise<CustomerTransaction[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select(
      "id, customer_id, transaction_type, points, balance_after, source, description, created_at",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    fail("No se pudo cargar el historial", error);
  }

  return (data ?? []) as CustomerTransaction[];
}

export async function getCustomerRewards(): Promise<CustomerReward[]> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, name, description, reward_type, points_cost, discount_amount_clp, minimum_purchase_clp, validity_days, shopify_product_id, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  if (error) {
    fail("No se pudieron cargar las recompensas", error);
  }

  return (data ?? []) as CustomerReward[];
}

export async function getCustomerRedemptions(
  customerId: number,
): Promise<CustomerRedemption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("reward_redemptions")
    .select(
      "id, customer_id, reward_id, loyalty_transaction_id, points_spent, status, redemption_code, shopify_discount_code, shopify_discount_status, shopify_discount_ends_at, shopify_discount_usage_count, redeemed_at, expires_at, fulfilled_at, cancelled_at, cancellation_reason, created_at, updated_at, rewards(name, discount_amount_clp)",
    )
    .eq("customer_id", customerId)
    .order("redeemed_at", { ascending: false });

  if (error) {
    fail("No se pudieron cargar los canjes", error);
  }

  return ((data ?? []) as unknown as CustomerRedemption[]).map((redemption) => {
    const isCurrent =
      redemption.status === "approved" &&
      Boolean(redemption.shopify_discount_code) &&
      (!redemption.shopify_discount_ends_at ||
        new Date(redemption.shopify_discount_ends_at).getTime() > Date.now());

    return {
      ...redemption,
      redemption_code: isCurrent ? redemption.shopify_discount_code : null,
      shopify_discount_code: isCurrent
        ? redemption.shopify_discount_code
        : null,
    };
  });
}

export async function getCustomerRule(): Promise<CustomerRule> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("loyalty_rules")
    .select(
      "id, name, spending_unit_clp, points_per_unit, point_redemption_value_clp, points_expiry_months, redemption_expiry_days, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .single();

  if (error) {
    fail("No se pudo cargar la regla de puntos", error);
  }

  return data as CustomerRule;
}

export async function getCustomerOverview(customer: CustomerAccount) {
  const [transactions, rewards, redemptions, rule] = await Promise.all([
    getCustomerTransactions(customer.id, 5),
    getCustomerRewards(),
    getCustomerRedemptions(customer.id),
    getCustomerRule(),
  ]);
  const nextReward =
    rewards.find((reward) => reward.points_cost > customer.points_balance) ??
    null;
  const pendingRedemptions = redemptions.filter(
    (redemption) =>
      redemption.status === "requested" ||
      redemption.status === "creating" ||
      redemption.status === "approved" ||
      redemption.status === "cancelling" ||
      redemption.status === "reconciliation_required",
  );

  return {
    transactions,
    rewards,
    redemptions,
    rule,
    nextReward,
    pendingRedemptions,
  };
}
