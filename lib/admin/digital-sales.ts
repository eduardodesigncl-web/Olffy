import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  addPointsTransaction,
  getActiveLoyaltyRule,
  confirmStorefrontRewardsByCodes,
  type LoyaltyCustomer,
} from "lib/loyalty/service";
import { getProductPointEligibility } from "lib/loyalty/eligibility";
import {
  calculateLoyaltySnapshot,
  type LoyaltyCalculation,
  type LoyaltyRuleSnapshot,
} from "lib/loyalty/calculation";
import { createGuestPendingClaim } from "lib/loyalty/guest-claims";
import { adminFetch } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { enqueueOrderMarketingEvents } from "lib/transactions/marketing";
import { updateOrderReference } from "lib/transactions/repository";
import type { OrderReference, PaidSaleSnapshot } from "lib/transactions/types";

export const DIGITAL_SALES_PAGE_SIZE = 50;

export type DigitalSalesSummary = {
  salesToday: number;
  totalSold: number;
  paidOrders: number;
  mercadoPagoOrders: number;
  checkoutFlowOrders: number;
  identifiedCustomers: number;
  pointsGenerated: number;
  pendingErrors: number;
};

export type DigitalSalesDashboard = {
  summary: DigitalSalesSummary;
  sales: OrderReference[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRows: number;
};

type ShopifyPaidOrder = {
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  financialStatus?: string | null;
  paymentGatewayNames: string[];
  total: number;
  subtotal: number;
  discount: number;
  discountCodes: string[];
  currency: "CLP";
  customer?: {
    id?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    acceptsMarketing?: boolean | null;
  };
  lineItemsCount?: number;
  /** Líneas confiables de Shopify; el metafield siempre pertenece al producto. */
  lineItems?: Array<{
    productId: string | null;
    variantId: string | null;
    sku?: string | null;
    productTitle: string;
    variantTitle: string;
    quantity: number;
    unitPrice: number;
    grossTotal: number;
    excludeFromPoints?: boolean;
  }>;
};

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

function toInt(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(Math.round(number), 0) : 0;
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toEmail(value: unknown): string | null {
  const email = toText(value)?.toLowerCase();
  return email && email.includes("@") ? email : null;
}

function gid(
  resource: "Order" | "Customer" | "Product" | "ProductVariant",
  value: unknown,
): string | null {
  const text = toText(value);
  if (!text) return null;
  if (text.startsWith("gid://shopify/")) return text;
  if (/^\d+$/.test(text)) return `gid://shopify/${resource}/${text}`;
  return text;
}

function firstPresent<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value !== null && value !== undefined) return value;
  }

  return null;
}

function paymentProviderFromGateways(gateways: string[]) {
  const normalized = gateways.join(" ").toLowerCase();

  if (normalized.includes("mercado")) return "mercado_pago";
  if (normalized.includes("flow")) return "checkout_flow";
  if (normalized.includes("tuu")) return "tuu";
  if (normalized.includes("shopify")) return "shopify_payments";

  return (
    gateways[0]
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_") || "unknown"
  );
}

function paymentLabelFromGateways(gateways: string[]) {
  if (gateways.length === 0) return "No informado";

  const provider = paymentProviderFromGateways(gateways);
  if (provider === "mercado_pago") return "Mercado Pago";
  if (provider === "checkout_flow") return "Checkout Flow";
  if (provider === "shopify_payments") return "Shopify Payments";
  if (provider === "tuu") return "TUU";

  return gateways.join(", ");
}

export function getDigitalSalePaymentLabel(sale: OrderReference) {
  const method = sale.metadata?.payment_method_label;
  if (typeof method === "string" && method.trim()) return method;

  if (sale.payment_provider === "mercado_pago") return "Mercado Pago";
  if (sale.payment_provider === "checkout_flow") return "Checkout Flow";
  if (sale.payment_provider === "shopify_payments") return "Shopify Payments";
  if (sale.payment_provider === "tuu") return "TUU";

  return sale.payment_provider || "No informado";
}

function normalizeSummary(
  value: Record<string, unknown> | null,
): DigitalSalesSummary {
  return {
    salesToday: toInt(value?.sales_today),
    totalSold: toInt(value?.total_sold),
    paidOrders: toInt(value?.paid_orders),
    mercadoPagoOrders: toInt(value?.mercado_pago_orders),
    checkoutFlowOrders: toInt(value?.checkout_flow_orders),
    identifiedCustomers: toInt(value?.identified_customers),
    pointsGenerated: toInt(value?.points_generated),
    pendingErrors: toInt(value?.pending_errors),
  };
}

function normalizePage(page?: number | string | null) {
  const value = Number(page);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export async function getDigitalSalesDashboard(input?: {
  page?: number | string | null;
}): Promise<DigitalSalesDashboard> {
  const page = normalizePage(input?.page);
  const from = (page - 1) * DIGITAL_SALES_PAGE_SIZE;
  const to = from + DIGITAL_SALES_PAGE_SIZE - 1;
  const supabase = getSupabaseAdmin();
  const [summaryResult, listResult] = await Promise.all([
    supabase.rpc("get_olffy_digital_sales_summary"),
    supabase
      .from("olffy_order_refs")
      .select("*", { count: "exact" })
      .eq("channel", "online")
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  if (summaryResult.error) {
    fail(
      "No se pudo cargar el resumen de ventas digitales",
      summaryResult.error,
    );
  }

  if (listResult.error) {
    fail("No se pudieron cargar las ventas digitales", listResult.error);
  }

  const totalRows = listResult.count ?? 0;

  return {
    summary: normalizeSummary(
      (summaryResult.data ?? null) as Record<string, unknown> | null,
    ),
    sales: (listResult.data ?? []) as OrderReference[],
    page,
    pageSize: DIGITAL_SALES_PAGE_SIZE,
    totalPages: Math.max(Math.ceil(totalRows / DIGITAL_SALES_PAGE_SIZE), 1),
    totalRows,
  };
}

export async function getDigitalSaleById(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .eq("id", id)
    .eq("channel", "online")
    .single();

  if (error) {
    fail("No se pudo cargar la venta digital", error);
  }

  return data as OrderReference;
}

function normalizeWebhookOrder(
  payload: Record<string, unknown>,
): ShopifyPaidOrder {
  const gateways = Array.isArray(payload.payment_gateway_names)
    ? payload.payment_gateway_names.map(String).filter(Boolean)
    : [];
  const customer = (payload.customer ?? {}) as Record<string, unknown>;
  const shopifyOrderId = gid(
    "Order",
    firstPresent(payload.admin_graphql_api_id, payload.id),
  );
  const currency = String(payload.currency ?? "CLP").toUpperCase();
  const discountCodes = Array.isArray(payload.discount_codes)
    ? payload.discount_codes
        .map((raw) => toText((raw as Record<string, unknown> | null)?.code))
        .filter((code): code is string => Boolean(code))
    : [];

  if (!shopifyOrderId) {
    throw new Error("Shopify no envio identificador de orden");
  }

  if (currency !== "CLP") {
    throw new Error("La orden Shopify no esta en CLP");
  }

  return {
    id: shopifyOrderId,
    name: toText(payload.name),
    email: toEmail(firstPresent(payload.email, payload.contact_email)),
    createdAt: toText(payload.created_at),
    processedAt: toText(payload.processed_at),
    financialStatus: toText(payload.financial_status)?.toLowerCase() ?? null,
    paymentGatewayNames: gateways,
    total: toInt(payload.total_price),
    subtotal: toInt(payload.subtotal_price),
    discount: toInt(payload.total_discounts),
    discountCodes,
    currency: "CLP",
    customer: {
      id: gid(
        "Customer",
        firstPresent(customer.admin_graphql_api_id, customer.id),
      ),
      email: toEmail(firstPresent(customer.email, payload.email)),
      firstName: toText(customer.first_name),
      lastName: toText(customer.last_name),
      acceptsMarketing:
        typeof customer.accepts_marketing === "boolean"
          ? customer.accepts_marketing
          : null,
    },
    lineItemsCount: Array.isArray(payload.line_items)
      ? payload.line_items.length
      : undefined,
    lineItems: Array.isArray(payload.line_items)
      ? payload.line_items.map((raw) => {
          const item = (raw ?? {}) as Record<string, unknown>;
          const quantity = Math.max(toInt(item.quantity), 1);
          const unitPrice = toInt(item.price);
          return {
            productId: gid("Product", item.product_id),
            variantId: gid("ProductVariant", item.variant_id),
            sku: toText(item.sku),
            productTitle: toText(item.title) ?? "Producto Shopify",
            variantTitle: toText(item.variant_title) ?? "Default Title",
            quantity,
            unitPrice,
            grossTotal: unitPrice * quantity,
          };
        })
      : undefined,
  };
}

type DigitalEligibility = {
  calculation: LoyaltyCalculation;
  items: PaidSaleSnapshot["items"];
};

async function computeDigitalEligibility(
  order: ShopifyPaidOrder,
  rule: LoyaltyRuleSnapshot,
): Promise<DigitalEligibility> {
  if (order.currency.toUpperCase() !== "CLP") {
    throw new Error(
      `La orden pagada usa ${order.currency}; OLFFY Puntos solo calcula montos CLP`,
    );
  }

  const lineItems = order.lineItems ?? [];

  if (lineItems.length === 0) {
    throw new Error(
      "Shopify no entregó las líneas de la orden; los puntos quedan pendientes de conciliación",
    );
  }

  const withoutEligibility = lineItems.filter(
    (item) => item.productId && item.excludeFromPoints === undefined,
  );
  if (lineItems.some((item) => !item.productId)) {
    throw new Error(
      "Una línea pagada no tiene producto Shopify para validar elegibilidad",
    );
  }
  const fetchedEligibility =
    withoutEligibility.length > 0
      ? await getProductPointEligibility(
          withoutEligibility.map((item) => item.productId as string),
        )
      : new Map<string, boolean>();

  if (
    withoutEligibility.some(
      (item) => !fetchedEligibility.has(item.productId as string),
    )
  ) {
    throw new Error(
      "Uno o más productos de la orden ya no existen en Shopify; se requiere revisión",
    );
  }
  const grossTotal = lineItems.reduce((sum, item) => sum + item.grossTotal, 0);
  if (order.subtotal < 0 || order.subtotal > grossTotal) {
    throw new Error(
      "El subtotal pagado no coincide con el snapshot de líneas Shopify",
    );
  }
  const paidProductsTotal = order.subtotal;
  const calculation = calculateLoyaltySnapshot({
    lines: lineItems.map((item) => {
      const excluded =
        item.excludeFromPoints === true ||
        (item.productId && fetchedEligibility.get(item.productId) === false);
      return {
        grossTotal: item.grossTotal,
        eligible: !excluded,
        exclusionReason: excluded ? "product_metafield_excluded" : undefined,
      };
    }),
    discount: grossTotal - paidProductsTotal,
    rule,
  });

  return {
    calculation,
    items: lineItems.map((item, index) => ({
      shopifyProductId: item.productId ?? "",
      shopifyVariantId: item.variantId ?? "",
      sku: item.sku ?? undefined,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      grossTotal: calculation.lines[index]!.grossTotal,
      allocatedDiscount: calculation.lines[index]!.allocatedDiscount,
      paidTotal: calculation.lines[index]!.paidTotal,
      eligible: calculation.lines[index]!.eligible,
      eligibleAmount: calculation.lines[index]!.eligibleAmount,
      exclusionReason: calculation.lines[index]!.exclusionReason,
    })),
  };
}

function isPaid(order: ShopifyPaidOrder) {
  return order.financialStatus === "paid" || order.financialStatus === "PAID";
}

async function findLoyaltyCustomer(order: ShopifyPaidOrder) {
  const supabase = getSupabaseAdmin();
  const shopifyCustomerId = order.customer?.id ?? null;
  const email = toEmail(firstPresent(order.customer?.email, order.email));

  if (shopifyCustomerId) {
    const { data, error } = await supabase
      .from("loyalty_customers")
      .select("*")
      .eq("shopify_customer_id", shopifyCustomerId)
      .maybeSingle();

    if (error) fail("No se pudo consultar el cliente OLFFY", error);
    if (data) return data as LoyaltyCustomer;
  }

  if (!email) return null;

  const { data, error } = await supabase
    .from("loyalty_customers")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (error) fail("No se pudo consultar el cliente OLFFY", error);

  return (data ?? null) as LoyaltyCustomer | null;
}

async function processDigitalPoints(input: {
  orderRef: OrderReference;
  customerId?: number;
  points: number;
  ruleId: number;
}) {
  if (
    !input.customerId ||
    input.points <= 0 ||
    !input.orderRef.shopify_order_id
  ) {
    return { status: "skipped" as const, transactionId: undefined };
  }

  const externalReference = `loyalty:${input.orderRef.shopify_order_id}:earned`;
  const { data: existing, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .select("id")
    .eq("source", "shopify_order")
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (error) fail("No se pudo consultar los puntos de la venta digital", error);

  if (existing) {
    return { status: "processed" as const, transactionId: Number(existing.id) };
  }

  const transaction = await addPointsTransaction({
    customerId: input.customerId,
    transactionType: "earned",
    points: input.points,
    source: "shopify_order",
    externalReference,
    description: "Puntos por compra online OLFFY",
    createdBy: "system:shopify_orders_paid",
    metadata: { order_ref_id: input.orderRef.id },
    ruleId: input.ruleId,
  });

  return { status: "processed" as const, transactionId: transaction.id };
}

async function upsertDigitalOrderReference(input: {
  order: ShopifyPaidOrder;
  loyaltyCustomer: LoyaltyCustomer | null;
  snapshot: PaidSaleSnapshot;
  source: "webhook" | "cron";
  webhookId?: string;
}) {
  const supabase = getSupabaseAdmin();
  const paymentProvider = paymentProviderFromGateways(
    input.order.paymentGatewayNames,
  );
  const paymentLabel = paymentLabelFromGateways(
    input.order.paymentGatewayNames,
  );
  const customerEmail = toEmail(
    firstPresent(input.order.customer?.email, input.order.email),
  );
  const customerName = [
    input.order.customer?.firstName,
    input.order.customer?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const idempotencyKey = `shopify_orders_paid:${input.order.id}`;
  const { data: existing, error: existingError } = await supabase
    .from("olffy_order_refs")
    .select("olffy_reference")
    .eq("shopify_order_id", input.order.id)
    .maybeSingle();

  if (existingError) {
    fail("No se pudo consultar la venta digital existente", existingError);
  }

  const { data, error } = await supabase
    .from("olffy_order_refs")
    .upsert(
      {
        idempotency_key: idempotencyKey,
        olffy_reference:
          existing?.olffy_reference ??
          input.order.name ??
          `SHOPIFY-${input.order.id.split("/").pop()}`,
        channel: "online",
        sale_channel_detail: "online_shopify",
        shopify_order_id: input.order.id,
        shopify_order_name: input.order.name ?? null,
        shopify_customer_id: input.order.customer?.id ?? null,
        customer_email: customerEmail,
        loyalty_customer_id: input.loyaltyCustomer?.id ?? null,
        payment_provider: paymentProvider,
        payment_reference: input.order.name ?? input.order.id,
        payment_status: "confirmed",
        total: input.order.total,
        currency: input.order.currency,
        points_earned: input.snapshot.pointsEarned,
        eligible_total: input.snapshot.eligibleTotal,
        excluded_total: input.snapshot.excludedTotal,
        rule_id: input.snapshot.rule.id,
        spending_unit_clp: input.snapshot.rule.spendingUnitClp,
        points_per_unit: input.snapshot.rule.pointsPerUnit,
        calculation_version: input.snapshot.calculationVersion,
        loyalty_snapshot: input.snapshot,
        metadata: {
          source: input.source,
          webhook_id: input.webhookId ?? null,
          idempotency_key: idempotencyKey,
          subtotal: input.order.subtotal,
          discount: input.order.discount,
          eligible_total: input.snapshot.eligibleTotal,
          excluded_amount: input.snapshot.excludedTotal,
          rule: input.snapshot.rule,
          calculation_version: input.snapshot.calculationVersion,
          items: input.snapshot.items,
          payment_method_label: paymentLabel,
          payment_gateway_names: input.order.paymentGatewayNames,
          customer_name: customerName || null,
          line_items_count: input.order.lineItemsCount ?? null,
          shopify_created_at: input.order.createdAt ?? null,
          shopify_processed_at: input.order.processedAt ?? null,
        },
        last_error: null,
        created_at:
          input.order.processedAt ?? input.order.createdAt ?? undefined,
      },
      { onConflict: "shopify_order_id" },
    )
    .select("*")
    .single();

  if (error) fail("No se pudo guardar la venta digital", error);

  return data as OrderReference;
}

async function recordDigitalProcessingFailure(input: {
  order: ShopifyPaidOrder;
  source: "webhook" | "cron";
  webhookId?: string;
  message: string;
}) {
  const idempotencyKey = `shopify_orders_paid:${input.order.id}`;
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .upsert(
      {
        idempotency_key: idempotencyKey,
        olffy_reference:
          input.order.name ?? `SHOPIFY-${input.order.id.split("/").pop()}`,
        channel: "online",
        sale_channel_detail: "online_shopify",
        shopify_order_id: input.order.id,
        shopify_order_name: input.order.name ?? null,
        shopify_customer_id: input.order.customer?.id ?? null,
        customer_email: toEmail(
          firstPresent(input.order.customer?.email, input.order.email),
        ),
        payment_provider: paymentProviderFromGateways(
          input.order.paymentGatewayNames,
        ),
        payment_reference: input.order.name ?? input.order.id,
        payment_status: "confirmed",
        loyalty_status: "failed",
        total: input.order.total,
        currency: input.order.currency,
        points_earned: 0,
        metadata: {
          source: input.source,
          webhook_id: input.webhookId ?? null,
          idempotency_key: idempotencyKey,
          payment_gateway_names: input.order.paymentGatewayNames,
          calculation_error: input.message,
        },
        last_error: input.message.slice(0, 2000),
      },
      { onConflict: "shopify_order_id" },
    )
    .select("id")
    .single();

  if (error) fail("No se pudo dejar visible la venta con error", error);
  return data as { id: string };
}

async function processNormalizedShopifyPaidOrder(input: {
  order: ShopifyPaidOrder;
  source: "webhook" | "cron";
  webhookId?: string;
}) {
  if (!isPaid(input.order)) return { ignored: true, reason: "not_paid" };

  // orders/paid es la confirmación definitiva: si la orden contiene un código
  // OLFFY reservado, se marca como usado de forma idempotente antes de cualquier
  // retorno temprano del procesamiento de puntos.
  await confirmStorefrontRewardsByCodes({
    codes: input.order.discountCodes,
    shopifyOrderId: input.order.id,
    createdBy: "system:shopify_orders_paid",
  });

  const { data: existingOrderRef, error: existingOrderRefError } =
    await getSupabaseAdmin()
      .from("olffy_order_refs")
      .select("*")
      .eq("shopify_order_id", input.order.id)
      .maybeSingle();

  if (existingOrderRefError) {
    fail(
      "No se pudo consultar la operacion Shopify existente",
      existingOrderRefError,
    );
  }

  if (
    existingOrderRef?.channel !== undefined &&
    existingOrderRef.channel !== "online"
  ) {
    return {
      ignored: true,
      reason: "existing_non_online_order_ref",
      orderRefId: existingOrderRef.id,
    };
  }

  if (
    existingOrderRef?.payment_status === "confirmed" &&
    ["processed", "skipped"].includes(existingOrderRef.loyalty_status)
  ) {
    return {
      ignored: true,
      reason: "already_processed",
      orderRefId: existingOrderRef.id,
    };
  }

  const loyaltyCustomer = await findLoyaltyCustomer(input.order);
  const guestEmail = !loyaltyCustomer
    ? toEmail(firstPresent(input.order.customer?.email, input.order.email))
    : null;
  let guestClaimPoints = 0;
  let snapshot = existingOrderRef?.loyalty_snapshot as
    | PaidSaleSnapshot
    | null
    | undefined;

  if (!snapshot?.rule || !Array.isArray(snapshot.items)) {
    try {
      const rule = await getActiveLoyaltyRule();
      const ruleSnapshot: LoyaltyRuleSnapshot = {
        id: rule.id,
        name: rule.name,
        spendingUnitClp: rule.spending_unit_clp,
        pointsPerUnit: rule.points_per_unit,
      };
      const eligibility = await computeDigitalEligibility(
        input.order,
        ruleSnapshot,
      );
      const customerEmail = toEmail(
        firstPresent(input.order.customer?.email, input.order.email),
      );
      const deliveredPoints =
        loyaltyCustomer?.status === "active"
          ? eligibility.calculation.pointsEarned
          : 0;

      if (!loyaltyCustomer && guestEmail) {
        guestClaimPoints = eligibility.calculation.pointsEarned;
      }

      snapshot = {
        channel: "online",
        saleChannelDetail: "online_shopify",
        items: eligibility.items,
        subtotal: input.order.subtotal,
        discount: eligibility.calculation.discountTotal,
        total: input.order.total,
        eligibleTotal: eligibility.calculation.eligibleTotal,
        excludedTotal: eligibility.calculation.excludedTotal,
        currency: "CLP",
        pointsEarned: deliveredPoints,
        rule: ruleSnapshot,
        calculationVersion: eligibility.calculation.calculationVersion,
        customer: customerEmail
          ? {
              loyaltyCustomerId: loyaltyCustomer?.id,
              shopifyCustomerId: input.order.customer?.id ?? undefined,
              email: customerEmail,
              marketingConsent:
                loyaltyCustomer?.metadata?.marketing_consent === true ||
                input.order.customer?.acceptsMarketing === true,
            }
          : undefined,
      };
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Error calculando puntos";
      const failed = await recordDigitalProcessingFailure({
        ...input,
        message,
      });
      return { ignored: false, orderRefId: failed.id, warning: message };
    }
  } else if (!loyaltyCustomer && guestEmail) {
    guestClaimPoints =
      Math.floor(snapshot.eligibleTotal / snapshot.rule.spendingUnitClp) *
      snapshot.rule.pointsPerUnit;
  }

  const orderRef = await upsertDigitalOrderReference({
    ...input,
    loyaltyCustomer,
    snapshot,
  });

  if (guestEmail && guestClaimPoints > 0) {
    try {
      await createGuestPendingClaim({
        shopifyOrderId: input.order.id,
        orderRefId: orderRef.id,
        email: guestEmail,
        points: guestClaimPoints,
        eligibleTotal: snapshot.eligibleTotal,
        purchasedAt:
          input.order.processedAt ??
          input.order.createdAt ??
          new Date().toISOString(),
      });
    } catch (cause) {
      console.error("No se pudo crear la reclamación de invitado:", cause);
    }
  }

  let loyalty: { status: "processed" | "skipped"; transactionId?: number };

  try {
    loyalty = await processDigitalPoints({
      orderRef,
      customerId: loyaltyCustomer?.id,
      points: snapshot.pointsEarned,
      ruleId: snapshot.rule.id,
    });
    await updateOrderReference(orderRef.id, {
      loyalty_status: loyalty.status,
      last_error: null,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Error registrando puntos";
    await updateOrderReference(orderRef.id, {
      loyalty_status: "failed",
      last_error: message.slice(0, 2000),
    });

    return { ignored: false, orderRefId: orderRef.id, warning: message };
  }

  try {
    await enqueueOrderMarketingEvents({
      orderRef,
      snapshot,
      pointsEarned: snapshot.pointsEarned,
      loyaltyTransactionId: loyalty.transactionId,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Error encolando marketing";
    await updateOrderReference(orderRef.id, {
      marketing_status: "failed",
      last_error: message.slice(0, 2000),
    });

    return { ignored: false, orderRefId: orderRef.id, warning: message };
  }

  return { ignored: false, orderRefId: orderRef.id };
}

export function verifyShopifyWebhookHmac(input: {
  rawBody: string;
  hmacHeader: string | null;
}) {
  const secret =
    process.env.SHOPIFY_WEBHOOK_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim() ||
    process.env.SHOPIFY_ADMIN_API_CLIENT_SECRET?.trim();

  if (!secret || !input.hmacHeader) return false;

  const digest = createHmac("sha256", secret)
    .update(input.rawBody, "utf8")
    .digest("base64");
  const expected = Buffer.from(digest);
  const received = Buffer.from(input.hmacHeader);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function processShopifyOrdersPaidWebhook(input: {
  rawBody: string;
  hmacHeader: string | null;
  webhookId?: string | null;
}) {
  if (
    !verifyShopifyWebhookHmac({
      rawBody: input.rawBody,
      hmacHeader: input.hmacHeader,
    })
  ) {
    throw new Error("Firma Shopify invalida");
  }

  const payload = JSON.parse(input.rawBody) as Record<string, unknown>;

  return processNormalizedShopifyPaidOrder({
    order: normalizeWebhookOrder(payload),
    source: "webhook",
    webhookId: input.webhookId ?? undefined,
  });
}

const recentPaidOrdersQuery = /* GraphQL */ `
  query recentPaidOrders($first: Int!, $query: String!) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        email
        createdAt
        processedAt
        displayFinancialStatus
        paymentGatewayNames
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        subtotalPriceSet {
          shopMoney {
            amount
          }
        }
        totalDiscountsSet {
          shopMoney {
            amount
          }
        }
        lineItems(first: 50) {
          nodes {
            id
            quantity
            name
            title
            variantTitle
            sku
            originalTotalSet {
              shopMoney {
                amount
              }
            }
            product {
              id
              excludeFromPoints: metafield(
                namespace: "olffy"
                key: "exclude_from_points"
              ) {
                value
                jsonValue
              }
            }
            variant {
              id
            }
          }
        }
      }
    }
  }
`;

type RecentPaidOrderNode = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string | null;
  processedAt: string | null;
  displayFinancialStatus: string | null;
  paymentGatewayNames: string[] | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  subtotalPriceSet?: { shopMoney: { amount: string } } | null;
  totalDiscountsSet?: { shopMoney: { amount: string } } | null;
  lineItems?: {
    nodes: Array<{
      id: string;
      quantity?: number | null;
      name?: string | null;
      title?: string | null;
      variantTitle?: string | null;
      sku?: string | null;
      originalTotalSet?: {
        shopMoney?: { amount?: string | null } | null;
      } | null;
      product?: {
        id?: string | null;
        excludeFromPoints?: {
          value?: string | null;
          jsonValue?: boolean | null;
        } | null;
      } | null;
      variant?: { id?: string | null } | null;
    }>;
  } | null;
};

function normalizeGraphqlOrder(node: RecentPaidOrderNode): ShopifyPaidOrder {
  const currency = node.totalPriceSet.shopMoney.currencyCode.toUpperCase();

  if (currency !== "CLP") {
    throw new Error(`La orden ${node.name ?? node.id} no esta en CLP`);
  }

  return {
    id: node.id,
    name: node.name,
    email: toEmail(node.email),
    createdAt: node.createdAt,
    processedAt: node.processedAt,
    financialStatus: node.displayFinancialStatus,
    paymentGatewayNames: node.paymentGatewayNames ?? [],
    total: toInt(node.totalPriceSet.shopMoney.amount),
    subtotal: toInt(node.subtotalPriceSet?.shopMoney.amount),
    discount: toInt(node.totalDiscountsSet?.shopMoney.amount),
    discountCodes: [],
    currency: "CLP",
    lineItemsCount: node.lineItems?.nodes.length,
    lineItems: node.lineItems?.nodes.map((line) => ({
      productId: line.product?.id ?? null,
      variantId: line.variant?.id ?? null,
      sku: line.sku ?? null,
      productTitle: line.title ?? line.name ?? "Producto Shopify",
      variantTitle: line.variantTitle ?? "Default Title",
      quantity: Math.max(Number(line.quantity ?? 1), 1),
      unitPrice: Math.round(
        toInt(line.originalTotalSet?.shopMoney?.amount) /
          Math.max(Number(line.quantity ?? 1), 1),
      ),
      grossTotal: toInt(line.originalTotalSet?.shopMoney?.amount),
      excludeFromPoints:
        line.product?.excludeFromPoints?.jsonValue === true ||
        line.product?.excludeFromPoints?.value === "true",
    })),
  };
}

export async function syncRecentShopifyPaidOrders(input?: {
  limit?: number;
  sinceHours?: number;
}) {
  const limit = Math.min(Math.max(input?.limit ?? 25, 1), 50);
  const sinceHours = Math.min(Math.max(input?.sinceHours ?? 48, 1), 720);
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const response = await adminFetch<{
    data: { orders: { nodes: RecentPaidOrderNode[] } };
    variables: { first: number; query: string };
  }>({
    query: recentPaidOrdersQuery,
    variables: {
      first: limit,
      query: `financial_status:paid created_at:>=${since}`,
    },
  });
  const results = [];

  for (const node of response.body.data.orders.nodes) {
    try {
      results.push(
        await processNormalizedShopifyPaidOrder({
          order: normalizeGraphqlOrder(node),
          source: "cron",
        }),
      );
    } catch (cause) {
      results.push({
        ignored: false,
        error: cause instanceof Error ? cause.message : "Error desconocido",
        order: node.name ?? node.id,
      });
    }
  }

  return {
    checked: response.body.data.orders.nodes.length,
    processed: results.filter(
      (result) => !result.ignored && !("error" in result),
    ).length,
    failed: results.filter((result) => "error" in result).length,
    results,
  };
}
