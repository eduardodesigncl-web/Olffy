import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  addPointsTransaction,
  calculatePointsForAmount,
  getActiveLoyaltyRule,
  type LoyaltyCustomer,
} from "lib/loyalty/service";
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
  currency: "CLP";
  customer?: {
    id?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    acceptsMarketing?: boolean | null;
  };
  lineItemsCount?: number;
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

function gid(resource: "Order" | "Customer", value: unknown): string | null {
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
  });

  return { status: "processed" as const, transactionId: transaction.id };
}

async function upsertDigitalOrderReference(input: {
  order: ShopifyPaidOrder;
  loyaltyCustomer: LoyaltyCustomer | null;
  pointsEarned: number;
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
        points_earned: input.pointsEarned,
        metadata: {
          source: input.source,
          webhook_id: input.webhookId ?? null,
          idempotency_key: idempotencyKey,
          subtotal: input.order.subtotal,
          discount: input.order.discount,
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

async function processNormalizedShopifyPaidOrder(input: {
  order: ShopifyPaidOrder;
  source: "webhook" | "cron";
  webhookId?: string;
}) {
  if (!isPaid(input.order)) return { ignored: true, reason: "not_paid" };

  const loyaltyCustomer = await findLoyaltyCustomer(input.order);
  let pointsEarned = 0;
  let pointsPreparationError: string | null = null;

  if (loyaltyCustomer?.status === "active") {
    try {
      const rule = await getActiveLoyaltyRule();
      pointsEarned = calculatePointsForAmount(input.order.total, rule);
    } catch (cause) {
      pointsPreparationError =
        cause instanceof Error ? cause.message : "Error calculando puntos";
    }
  }

  const orderRef = await upsertDigitalOrderReference({
    ...input,
    loyaltyCustomer,
    pointsEarned,
  });

  if (pointsPreparationError) {
    await updateOrderReference(orderRef.id, {
      loyalty_status: "failed",
      last_error: pointsPreparationError.slice(0, 2000),
    });

    return {
      ignored: false,
      orderRefId: orderRef.id,
      warning: pointsPreparationError,
    };
  }

  let loyalty: { status: "processed" | "skipped"; transactionId?: number };

  try {
    loyalty = await processDigitalPoints({
      orderRef,
      customerId: loyaltyCustomer?.id,
      points: pointsEarned,
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

  const customerEmail = toEmail(
    firstPresent(input.order.customer?.email, input.order.email),
  );
  const snapshot: PaidSaleSnapshot = {
    channel: "online",
    saleChannelDetail: "online_shopify",
    items: [],
    subtotal: input.order.subtotal,
    discount: input.order.discount,
    total: input.order.total,
    currency: "CLP",
    pointsEarned,
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

  try {
    await enqueueOrderMarketingEvents({
      orderRef,
      snapshot,
      pointsEarned,
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
        customer {
          id
          firstName
          lastName
          defaultEmailAddress {
            emailAddress
            marketingState
          }
        }
        lineItems(first: 1) {
          nodes {
            id
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
  customer?: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    defaultEmailAddress?: {
      emailAddress: string | null;
      marketingState: string | null;
    } | null;
  } | null;
  lineItems?: { nodes: Array<{ id: string }> } | null;
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
    currency: "CLP",
    customer: node.customer
      ? {
          id: node.customer.id,
          email: toEmail(node.customer.defaultEmailAddress?.emailAddress),
          firstName: node.customer.firstName,
          lastName: node.customer.lastName,
          acceptsMarketing:
            node.customer.defaultEmailAddress?.marketingState === "SUBSCRIBED",
        }
      : undefined,
    lineItemsCount: node.lineItems?.nodes.length,
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
