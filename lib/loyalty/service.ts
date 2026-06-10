import "server-only";

import { getSupabaseAdmin } from "lib/supabase/admin";

export type LoyaltyStats = {
  customersCount: number;
  activeCustomersCount: number;
  outstandingPoints: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  physicalSalesCount: number;
  physicalSalesTotal: number;
  activeRewardsCount: number;
  redemptionsCount: number;
};

export type LoyaltyCustomer = {
  id: number;
  shopify_customer_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  qr_token: string;
  status: "active" | "blocked";
  points_balance: number;
  lifetime_points_earned: number;
  lifetime_points_redeemed: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LoyaltyTransaction = {
  id: number;
  customer_id: number;
  transaction_type: "earned" | "redeemed" | "adjusted" | "expired" | "reversed";
  points: number;
  balance_after: number;
  source:
    | "physical_sale"
    | "shopify_order"
    | "reward_redemption"
    | "manual"
    | "system";
  external_reference: string | null;
  physical_sale_id: number | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type CreateLoyaltyCustomerInput = {
  email: string;
  fullName?: string;
  phone?: string;
  shopifyCustomerId?: string;
  metadata?: Record<string, unknown>;
};

export type PhysicalSaleItemInput = {
  shopifyProductId: string;
  shopifyVariantId?: string;
  sku?: string;
  productTitle: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
};

export type RegisterPhysicalSaleInput = {
  customerId?: number;
  tuuTransactionId: string;
  receiptNumber?: string;
  subtotal: number;
  discount?: number;
  total: number;
  pointsEarned?: number;
  items?: PhysicalSaleItemInput[];
  notes?: string;
  soldAt?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
};

export type AddPointsTransactionInput = {
  customerId: number;
  transactionType: LoyaltyTransaction["transaction_type"];
  points: number;
  source: LoyaltyTransaction["source"];
  externalReference?: string;
  physicalSaleId?: number;
  description?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
};

export type LoyaltyRule = {
  id: number;
  name: string;
  spending_unit_clp: number;
  points_per_unit: number;
  point_redemption_value_clp: number;
  points_expiry_months: number;
  redemption_expiry_days: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type LoyaltyReward = {
  id: number;
  name: string;
  description: string | null;
  reward_type: "discount" | "product" | "experience" | "other";
  points_cost: number;
  discount_amount_clp: number | null;
  minimum_purchase_clp: number;
  validity_days: number;
  shopify_product_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RewardRedemption = {
  id: number;
  customer_id: number;
  reward_id: number;
  loyalty_transaction_id: number | null;
  points_spent: number;
  status: "requested" | "approved" | "fulfilled" | "cancelled";
  redemption_code: string | null;
  metadata: Record<string, unknown>;
  redeemed_at: string;
  expires_at: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  rewards?: Pick<LoyaltyReward, "name" | "discount_amount_clp"> | null;
};

export type PhysicalSale = {
  id: number;
  customer_id: number | null;
  tuu_transaction_id: string;
  receipt_number: string | null;
  payment_method: "tuu";
  currency: "CLP";
  subtotal: number;
  discount: number;
  total: number;
  points_earned: number;
  points_spent: number;
  shopify_order_id: string | null;
  shopify_order_name: string | null;
  benefit_type: "none" | "points" | "discount_code" | "manual_discount";
  benefit_amount: number;
  discount_code: string | null;
  manual_discount_reason: string | null;
  notes: string | null;
  sold_at: string;
  created_by: string | null;
  created_at: string;
  loyalty_customers?: Pick<LoyaltyCustomer, "email" | "full_name"> | null;
};

export type PhysicalSalePosBenefit =
  | "none"
  | "points"
  | "discount_code"
  | "manual_discount";

export type PhysicalSaleAttempt = {
  attemptId: string;
  claimToken?: string;
  status: "pending" | "completed" | "failed";
  shopifyOrderId?: string;
  shopifyOrderName?: string;
  physicalSaleId?: number;
};

export type FinalizePhysicalSalePosInput = {
  attemptId: string;
  claimToken: string;
  customerId?: number;
  tuuTransactionId: string;
  receiptNumber?: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  subtotal: number;
  discount: number;
  total: number;
  benefitType: PhysicalSalePosBenefit;
  pointsSpent: number;
  pointsEarned: number;
  discountCode?: string;
  manualDiscountReason?: string;
  items: PhysicalSaleItemInput[];
  notes?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
};

export type UpdateLoyaltyCustomerInput = {
  fullName?: string;
  phone?: string;
  status?: LoyaltyCustomer["status"];
  shopifyCustomerId?: string;
  metadata?: Record<string, unknown>;
};

export type CreateRewardInput = {
  name: string;
  description?: string;
  rewardType?: LoyaltyReward["reward_type"];
  pointsCost: number;
  discountAmountClp?: number;
  minimumPurchaseClp?: number;
  validityDays?: number;
  shopifyProductId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

function throwSupabaseError(
  context: string,
  error: { message: string },
): never {
  throw new Error(`${context}: ${error.message}`);
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getLoyaltyStats(): Promise<LoyaltyStats> {
  const { data, error } = await getSupabaseAdmin().rpc("get_loyalty_stats");

  if (error) {
    throwSupabaseError(
      "No se pudieron cargar las estadisticas de puntos",
      error,
    );
  }

  const stats = (data ?? {}) as Record<string, unknown>;

  return {
    customersCount: toNumber(stats.customers_count),
    activeCustomersCount: toNumber(stats.active_customers_count),
    outstandingPoints: toNumber(stats.outstanding_points),
    lifetimePointsEarned: toNumber(stats.lifetime_points_earned),
    lifetimePointsRedeemed: toNumber(stats.lifetime_points_redeemed),
    physicalSalesCount: toNumber(stats.physical_sales_count),
    physicalSalesTotal: toNumber(stats.physical_sales_total),
    activeRewardsCount: toNumber(stats.active_rewards_count),
    redemptionsCount: toNumber(stats.redemptions_count),
  };
}

export async function searchLoyaltyCustomers(
  query: string,
  limit = 25,
): Promise<LoyaltyCustomer[]> {
  const supabase = getSupabaseAdmin();
  const normalizedQuery = query.trim().replace(/[,*()]/g, " ");
  let request = supabase
    .from("loyalty_customers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (normalizedQuery) {
    const pattern = `%${normalizedQuery}%`;
    request = request.or(
      `email.ilike.${pattern},full_name.ilike.${pattern},phone.ilike.${pattern},shopify_customer_id.ilike.${pattern}`,
    );
  }

  const { data, error } = await request;

  if (error) {
    throwSupabaseError("No se pudieron buscar clientes de puntos", error);
  }

  return (data ?? []) as LoyaltyCustomer[];
}

export async function createLoyaltyCustomer(
  input: CreateLoyaltyCustomerInput,
): Promise<LoyaltyCustomer> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .insert({
      email: input.email.trim().toLowerCase(),
      full_name: input.fullName?.trim() || null,
      phone: input.phone?.trim() || null,
      shopify_customer_id: input.shopifyCustomerId?.trim() || null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throwSupabaseError("No se pudo crear el cliente de puntos", error);
  }

  return data as LoyaltyCustomer;
}

export async function getLoyaltyCustomer(
  customerId: number,
): Promise<LoyaltyCustomer> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    throwSupabaseError("No se pudo cargar el cliente de puntos", error);
  }

  return data as LoyaltyCustomer;
}

export async function updateLoyaltyCustomer(
  customerId: number,
  input: UpdateLoyaltyCustomerInput,
): Promise<LoyaltyCustomer> {
  const changes: Record<string, unknown> = {};

  if (input.fullName !== undefined) {
    changes.full_name = input.fullName.trim() || null;
  }
  if (input.phone !== undefined) {
    changes.phone = input.phone.trim() || null;
  }
  if (input.status !== undefined) {
    changes.status = input.status;
  }
  if (input.shopifyCustomerId !== undefined) {
    changes.shopify_customer_id = input.shopifyCustomerId.trim() || null;
  }
  if (input.metadata !== undefined) {
    changes.metadata = input.metadata;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .update(changes)
    .eq("id", customerId)
    .select("*")
    .single();

  if (error) {
    throwSupabaseError("No se pudo actualizar el cliente de puntos", error);
  }

  return data as LoyaltyCustomer;
}

export async function getActiveLoyaltyRule(): Promise<LoyaltyRule> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_rules")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    throwSupabaseError("No se pudo cargar la regla activa de puntos", error);
  }

  return data as LoyaltyRule;
}

export function calculatePointsForAmount(
  amountPaid: number,
  rule: Pick<LoyaltyRule, "spending_unit_clp" | "points_per_unit">,
): number {
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    return 0;
  }

  return Math.floor(amountPaid / rule.spending_unit_clp) * rule.points_per_unit;
}

export async function registerPhysicalSale(
  input: RegisterPhysicalSaleInput,
): Promise<number> {
  const items = input.items ?? [];
  const { data, error } = await getSupabaseAdmin().rpc(
    "register_physical_sale",
    {
      p_customer_id: input.customerId ?? null,
      p_tuu_transaction_id: input.tuuTransactionId.trim(),
      p_receipt_number: input.receiptNumber?.trim() || null,
      p_subtotal: input.subtotal,
      p_discount: input.discount ?? 0,
      p_total: input.total,
      p_items: items.map((item) => ({
        shopify_product_id: item.shopifyProductId,
        shopify_variant_id: item.shopifyVariantId ?? null,
        sku: item.sku ?? null,
        product_title: item.productTitle,
        variant_title: item.variantTitle ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      p_points_earned: input.pointsEarned ?? 0,
      p_notes: input.notes?.trim() || null,
      p_created_by: input.createdBy?.trim() || null,
      p_sold_at: input.soldAt ?? new Date().toISOString(),
      p_metadata: input.metadata ?? {},
    },
  );

  if (error) {
    throwSupabaseError("No se pudo registrar la venta fisica TUU", error);
  }

  return toNumber(data);
}

export async function claimPhysicalSalePosAttempt(input: {
  tuuTransactionId: string;
  payloadFingerprint: string;
  createdBy: string;
}): Promise<PhysicalSaleAttempt> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_physical_sale_pos_attempt",
    {
      p_tuu_transaction_id: input.tuuTransactionId.trim(),
      p_payload_fingerprint: input.payloadFingerprint.trim(),
      p_created_by: input.createdBy.trim(),
    },
  );

  if (error) {
    throwSupabaseError("No se pudo reservar la venta TUU", error);
  }

  const result = data as Record<string, unknown>;

  return {
    attemptId: String(result.attempt_id),
    claimToken: result.claim_token ? String(result.claim_token) : undefined,
    status: String(result.status) as PhysicalSaleAttempt["status"],
    shopifyOrderId: result.shopify_order_id
      ? String(result.shopify_order_id)
      : undefined,
    shopifyOrderName: result.shopify_order_name
      ? String(result.shopify_order_name)
      : undefined,
    physicalSaleId: result.physical_sale_id
      ? toNumber(result.physical_sale_id)
      : undefined,
  };
}

export async function failPhysicalSalePosAttempt(input: {
  attemptId: string;
  claimToken: string;
  error: string;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "fail_physical_sale_pos_attempt",
    {
      p_attempt_id: input.attemptId,
      p_claim_token: input.claimToken,
      p_error: input.error,
    },
  );

  if (error) {
    console.error("No se pudo marcar el intento TUU como fallido:", error);
  }
}

export async function finalizePhysicalSalePos(
  input: FinalizePhysicalSalePosInput,
): Promise<{
  physicalSaleId: number;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  alreadyCompleted: boolean;
}> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "finalize_physical_sale_pos",
    {
      p_attempt_id: input.attemptId,
      p_claim_token: input.claimToken,
      p_customer_id: input.customerId ?? null,
      p_tuu_transaction_id: input.tuuTransactionId.trim(),
      p_receipt_number: input.receiptNumber?.trim() || null,
      p_shopify_order_id: input.shopifyOrderId.trim(),
      p_shopify_order_name: input.shopifyOrderName?.trim() || null,
      p_subtotal: input.subtotal,
      p_discount: input.discount,
      p_total: input.total,
      p_benefit_type: input.benefitType,
      p_points_spent: input.pointsSpent,
      p_points_earned: input.pointsEarned,
      p_discount_code: input.discountCode?.trim() || null,
      p_manual_discount_reason: input.manualDiscountReason?.trim() || null,
      p_items: input.items.map((item) => ({
        shopify_product_id: item.shopifyProductId,
        shopify_variant_id: item.shopifyVariantId ?? null,
        sku: item.sku ?? null,
        product_title: item.productTitle,
        variant_title: item.variantTitle ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      p_notes: input.notes?.trim() || null,
      p_created_by: input.createdBy.trim(),
      p_metadata: input.metadata ?? {},
    },
  );

  if (error) {
    throwSupabaseError("No se pudo completar la venta fisica TUU", error);
  }

  const result = data as Record<string, unknown>;

  return {
    physicalSaleId: toNumber(result.physical_sale_id),
    shopifyOrderId: String(result.shopify_order_id),
    shopifyOrderName: result.shopify_order_name
      ? String(result.shopify_order_name)
      : undefined,
    alreadyCompleted: Boolean(result.already_completed),
  };
}

export async function listPhysicalSales(limit = 50): Promise<PhysicalSale[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("physical_sales")
    .select("*, loyalty_customers(email, full_name)")
    .order("sold_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    throwSupabaseError("No se pudieron cargar las ventas fisicas TUU", error);
  }

  return (data ?? []) as PhysicalSale[];
}

export async function addPointsTransaction(
  input: AddPointsTransactionInput,
): Promise<LoyaltyTransaction> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .insert({
      customer_id: input.customerId,
      transaction_type: input.transactionType,
      points: input.points,
      balance_after: 0,
      source: input.source,
      external_reference: input.externalReference?.trim() || null,
      physical_sale_id: input.physicalSaleId ?? null,
      description: input.description?.trim() || null,
      created_by: input.createdBy?.trim() || null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throwSupabaseError("No se pudo registrar la transaccion de puntos", error);
  }

  return data as LoyaltyTransaction;
}

export async function adjustCustomerPoints(input: {
  customerId: number;
  points: number;
  reason: string;
  createdBy: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "adjust_loyalty_points",
    {
      p_customer_id: input.customerId,
      p_points: input.points,
      p_reason: input.reason.trim(),
      p_created_by: input.createdBy.trim(),
      p_external_reference: input.externalReference?.trim() || null,
      p_metadata: input.metadata ?? {},
    },
  );

  if (error) {
    throwSupabaseError("No se pudo ajustar el saldo de puntos", error);
  }

  return toNumber(data);
}

export async function reversePointsTransaction(input: {
  transactionId: number;
  reason: string;
  createdBy: string;
}): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "reverse_loyalty_transaction",
    {
      p_transaction_id: input.transactionId,
      p_reason: input.reason.trim(),
      p_created_by: input.createdBy.trim(),
    },
  );

  if (error) {
    throwSupabaseError("No se pudo reversar la transaccion de puntos", error);
  }

  return toNumber(data);
}

export async function getCustomerBalance(customerId: number): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .select("points_balance")
    .eq("id", customerId)
    .single();

  if (error) {
    throwSupabaseError("No se pudo cargar el saldo del cliente", error);
  }

  return toNumber(data.points_balance);
}

export async function getCustomerTransactions(
  customerId: number,
  limit = 50,
  offset = 0,
): Promise<LoyaltyTransaction[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeOffset = Math.max(offset, 0);
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (error) {
    throwSupabaseError(
      "No se pudieron cargar las transacciones del cliente",
      error,
    );
  }

  return (data ?? []) as LoyaltyTransaction[];
}

export async function listRewards(
  activeOnly = false,
): Promise<LoyaltyReward[]> {
  let request = getSupabaseAdmin()
    .from("rewards")
    .select("*")
    .order("points_cost", { ascending: true });

  if (activeOnly) {
    request = request.eq("is_active", true);
  }

  const { data, error } = await request;

  if (error) {
    throwSupabaseError("No se pudieron cargar las recompensas", error);
  }

  return (data ?? []) as LoyaltyReward[];
}

export async function createReward(
  input: CreateRewardInput,
): Promise<LoyaltyReward> {
  const { data, error } = await getSupabaseAdmin()
    .from("rewards")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      reward_type: input.rewardType ?? "discount",
      points_cost: input.pointsCost,
      discount_amount_clp: input.discountAmountClp ?? null,
      minimum_purchase_clp: input.minimumPurchaseClp ?? 0,
      validity_days: input.validityDays ?? 30,
      shopify_product_id: input.shopifyProductId?.trim() || null,
      is_active: input.isActive ?? true,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throwSupabaseError("No se pudo crear la recompensa", error);
  }

  return data as LoyaltyReward;
}

export async function updateReward(
  rewardId: number,
  input: Partial<CreateRewardInput>,
): Promise<LoyaltyReward> {
  const changes: Record<string, unknown> = {};

  if (input.name !== undefined) changes.name = input.name.trim();
  if (input.description !== undefined) {
    changes.description = input.description.trim() || null;
  }
  if (input.rewardType !== undefined) changes.reward_type = input.rewardType;
  if (input.pointsCost !== undefined) changes.points_cost = input.pointsCost;
  if (input.discountAmountClp !== undefined) {
    changes.discount_amount_clp = input.discountAmountClp;
  }
  if (input.minimumPurchaseClp !== undefined) {
    changes.minimum_purchase_clp = input.minimumPurchaseClp;
  }
  if (input.validityDays !== undefined) {
    changes.validity_days = input.validityDays;
  }
  if (input.shopifyProductId !== undefined) {
    changes.shopify_product_id = input.shopifyProductId.trim() || null;
  }
  if (input.isActive !== undefined) changes.is_active = input.isActive;
  if (input.metadata !== undefined) changes.metadata = input.metadata;

  const { data, error } = await getSupabaseAdmin()
    .from("rewards")
    .update(changes)
    .eq("id", rewardId)
    .select("*")
    .single();

  if (error) {
    throwSupabaseError("No se pudo actualizar la recompensa", error);
  }

  return data as LoyaltyReward;
}

export async function redeemReward(input: {
  customerId: number;
  rewardId: number;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  redemptionId: number;
  transactionId: number;
  redemptionCode: string;
  expiresAt: string;
}> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "redeem_loyalty_reward",
    {
      p_customer_id: input.customerId,
      p_reward_id: input.rewardId,
      p_created_by: input.createdBy.trim(),
      p_metadata: input.metadata ?? {},
    },
  );

  if (error) {
    throwSupabaseError("No se pudo registrar el canje", error);
  }

  const result = data as Record<string, unknown>;

  return {
    redemptionId: toNumber(result.redemption_id),
    transactionId: toNumber(result.transaction_id),
    redemptionCode: String(result.redemption_code),
    expiresAt: String(result.expires_at),
  };
}

export async function getCustomerRedemptions(
  customerId: number,
): Promise<RewardRedemption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("reward_redemptions")
    .select("*, rewards(name, discount_amount_clp)")
    .eq("customer_id", customerId)
    .order("redeemed_at", { ascending: false });

  if (error) {
    throwSupabaseError("No se pudieron cargar los canjes del cliente", error);
  }

  return (data ?? []) as RewardRedemption[];
}

export async function updateRedemptionStatus(input: {
  redemptionId: number;
  status: "approved" | "fulfilled";
  createdBy: string;
}): Promise<RewardRedemption> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "update_reward_redemption_status",
    {
      p_redemption_id: input.redemptionId,
      p_status: input.status,
      p_created_by: input.createdBy.trim(),
    },
  );

  if (error) {
    throwSupabaseError("No se pudo actualizar el estado del canje", error);
  }

  return data as RewardRedemption;
}

export async function cancelRewardRedemption(input: {
  redemptionId: number;
  reason: string;
  createdBy: string;
}): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "cancel_reward_redemption",
    {
      p_redemption_id: input.redemptionId,
      p_reason: input.reason.trim(),
      p_created_by: input.createdBy.trim(),
    },
  );

  if (error) {
    throwSupabaseError("No se pudo cancelar el canje", error);
  }

  return toNumber(data);
}
