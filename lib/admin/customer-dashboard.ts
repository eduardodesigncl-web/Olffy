import "server-only";

import { getSupabaseAdmin } from "lib/supabase/admin";

export type CustomerPortalStats = {
  customersCount: number;
  activeCustomersCount: number;
  blockedCustomersCount: number;
  linkedCustomersCount: number;
  pendingCustomersCount: number;
  outstandingPoints: number;
  activeRewardsCount: number;
  requestedRedemptionsCount: number;
  approvedRedemptionsCount: number;
};

export type CustomerPortalCustomer = {
  id: number;
  email: string;
  full_name: string | null;
  status: "active" | "blocked";
  points_balance: number;
  auth_user_id: string | null;
  created_at: string;
};

export type CustomerPortalRedemption = {
  id: number;
  customer_id: number;
  points_spent: number;
  status: "requested" | "approved" | "fulfilled" | "cancelled";
  redeemed_at: string;
  redemption_code: string | null;
  loyalty_customers:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
  rewards: { name: string } | { name: string }[] | null;
};

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

function countByStatus(
  rows: { status: string }[] | null,
  status: string,
): number {
  return rows?.filter((row) => row.status === status).length ?? 0;
}

export async function getCustomerPortalDashboard() {
  const supabase = getSupabaseAdmin();
  const [customersResult, rewardsResult, redemptionsResult] = await Promise.all(
    [
      supabase
        .from("loyalty_customers")
        .select(
          "id, email, full_name, status, points_balance, auth_user_id, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("rewards").select("id").eq("is_active", true),
      supabase
        .from("reward_redemptions")
        .select(
          "id, customer_id, points_spent, status, redeemed_at, redemption_code, loyalty_customers(email, full_name), rewards(name)",
        )
        .order("redeemed_at", { ascending: false }),
    ],
  );

  if (customersResult.error) {
    fail(
      "No se pudieron cargar los clientes del portal",
      customersResult.error,
    );
  }
  if (rewardsResult.error) {
    fail(
      "No se pudieron cargar las recompensas del portal",
      rewardsResult.error,
    );
  }
  if (redemptionsResult.error) {
    fail(
      "No se pudieron cargar los canjes del portal",
      redemptionsResult.error,
    );
  }

  const customers = (customersResult.data ?? []) as CustomerPortalCustomer[];
  const redemptions = (redemptionsResult.data ??
    []) as unknown as CustomerPortalRedemption[];
  const stats: CustomerPortalStats = {
    customersCount: customers.length,
    activeCustomersCount: countByStatus(customers, "active"),
    blockedCustomersCount: countByStatus(customers, "blocked"),
    linkedCustomersCount: customers.filter((customer) => customer.auth_user_id)
      .length,
    pendingCustomersCount: customers.filter(
      (customer) => !customer.auth_user_id,
    ).length,
    outstandingPoints: customers.reduce(
      (total, customer) => total + Number(customer.points_balance),
      0,
    ),
    activeRewardsCount: rewardsResult.data?.length ?? 0,
    requestedRedemptionsCount: countByStatus(redemptions, "requested"),
    approvedRedemptionsCount: countByStatus(redemptions, "approved"),
  };

  return {
    stats,
    recentCustomers: customers.slice(0, 6),
    pendingRedemptions: redemptions
      .filter(
        (redemption) =>
          redemption.status === "requested" || redemption.status === "approved",
      )
      .slice(0, 6),
  };
}
