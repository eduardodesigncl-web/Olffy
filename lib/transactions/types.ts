export type ValidatedSaleItem = {
  shopifyProductId: string;
  shopifyVariantId: string;
  sku?: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  grossTotal: number;
  allocatedDiscount: number;
  paidTotal: number;
  eligible: boolean;
  eligibleAmount: number;
  exclusionReason: string | null;
};

export type PaidSaleSnapshot = {
  channel: "online" | "physical";
  saleChannelDetail: string;
  items: ValidatedSaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  eligibleTotal: number;
  excludedTotal: number;
  currency: "CLP";
  pointsEarned: number;
  rule: {
    id: number;
    name: string;
    spendingUnitClp: number;
    pointsPerUnit: number;
  };
  calculationVersion: string;
  customer?: {
    loyaltyCustomerId?: number;
    shopifyCustomerId?: string;
    email: string;
    marketingConsent: boolean;
  };
};

export type OrderReference = {
  id: string;
  idempotency_key: string | null;
  olffy_reference: string;
  channel: "online" | "physical";
  sale_channel_detail: string;
  shopify_order_id: string | null;
  shopify_order_name: string | null;
  shopify_customer_id: string | null;
  customer_email: string | null;
  loyalty_customer_id: number | null;
  payment_provider: string;
  payment_reference: string | null;
  payment_status: "pending" | "confirmed" | "rejected" | "manual_review";
  tax_status: "pending" | "issued" | "accepted" | "rejected" | "manual_review";
  loyalty_status: "pending" | "processed" | "skipped" | "failed";
  marketing_status: "pending" | "processed" | "skipped" | "failed";
  total: number;
  currency: "CLP";
  points_earned: number;
  eligible_total?: number;
  excluded_total?: number;
  rule_id?: number | null;
  spending_unit_clp?: number | null;
  points_per_unit?: number | null;
  calculation_version?: string | null;
  loyalty_snapshot?: PaidSaleSnapshot | null;
  metadata: Record<string, unknown>;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
