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
  customerId: number;
  tuuTransactionId: string;
  receiptNumber?: string;
  subtotal: number;
  discount?: number;
  total: number;
  pointsEarned?: number;
  items: PhysicalSaleItemInput[];
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

export async function registerPhysicalSale(
  input: RegisterPhysicalSaleInput,
): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "register_physical_sale",
    {
      p_customer_id: input.customerId,
      p_tuu_transaction_id: input.tuuTransactionId.trim(),
      p_receipt_number: input.receiptNumber?.trim() || null,
      p_subtotal: input.subtotal,
      p_discount: input.discount ?? 0,
      p_total: input.total,
      p_items: input.items.map((item) => ({
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
