import "server-only";

import { getFrontendAdminData } from "src/integration/admin-data";
import { listOrderReferences } from "lib/transactions/repository";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getActiveLoyaltyRule, listRewards } from "lib/loyalty/service";
import { getAbandonedCheckoutsSummary } from "lib/shopify/abandoned-checkouts";
import type { OrderReference } from "lib/transactions/types";
import type { AdminPanelData, UnifiedSale } from "./types";

const CHILE_TIME_ZONE = "America/Santiago";

const productBackgrounds = [
  "#F2E0CC",
  "#FFE9A8",
  "#DEDDF2",
  "#FBD4C2",
  "#FFF1CE",
];

function clp(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CHILE_TIME_ZONE,
  }).format(new Date(value));
}

function chileDayKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function sourceLabel(source: string | null | undefined) {
  if (source === "shopify_order") return "Shopify";
  if (source === "physical_sale") return "TUU";
  if (source === "reward_redemption") return "Canje";
  return "Admin";
}

function paymentMethodLabel(provider: string | null | undefined) {
  switch (provider) {
    case "mercado_pago":
      return "Mercado Pago";
    case "checkout_flow":
      return "Checkout Flow";
    case "shopify_payments":
      return "Shopify Payments";
    case "tuu":
      return "TUU";
    case "unknown":
    case "":
    case null:
    case undefined:
      return "No informado";
    default:
      return provider
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function paymentStatusLabel(
  status: OrderReference["payment_status"],
): UnifiedSale["estadoPago"] {
  switch (status) {
    case "confirmed":
      return "Pagado";
    case "rejected":
      return "Rechazado";
    case "manual_review":
      return "Revisión";
    default:
      return "Pendiente";
  }
}

function taxStatusLabel(status: OrderReference["tax_status"]) {
  switch (status) {
    case "issued":
      return "Emitida";
    case "accepted":
      return "Aceptada";
    case "rejected":
      return "Rechazada";
    case "manual_review":
      return "Revisión manual";
    default:
      return "Pendiente";
  }
}

function movementType(type: string | null | undefined) {
  switch (type) {
    case "earned":
      return "Puntos acumulados";
    case "redeemed":
      return "Canje recompensa";
    case "reversed":
      return "Reversa";
    case "expired":
      return "Expiración";
    default:
      return "Ajuste manual";
  }
}

function toUnifiedSale(order: OrderReference): UnifiedSale {
  const metadata = (order.metadata ?? {}) as {
    customer_name?: string | null;
    items?: Array<{
      productTitle?: string;
      variantTitle?: string;
      quantity?: number;
      unitPrice?: number;
      paidTotal?: number;
      eligible?: boolean;
    }> | null;
    eligible_total?: number;
    excluded_amount?: number;
    rule?: {
      name?: string;
      spendingUnitClp?: number;
      pointsPerUnit?: number;
    };
  };
  const customerName =
    typeof metadata.customer_name === "string" && metadata.customer_name.trim()
      ? metadata.customer_name.trim()
      : null;
  const origen = order.channel === "physical" ? "fisica" : "online";

  return {
    id: order.id,
    folio: order.shopify_order_name || order.olffy_reference,
    cliente:
      customerName ||
      order.customer_email ||
      (origen === "fisica" ? "Venta anónima" : "Cliente invitado"),
    email: order.customer_email ?? "",
    fechaISO: order.created_at,
    fecha: dateLabel(order.created_at),
    total: clp(Number(order.total ?? 0)),
    totalN: Number(order.total ?? 0),
    metodoPago: paymentMethodLabel(order.payment_provider),
    estadoPago: paymentStatusLabel(order.payment_status),
    origen,
    origenLabel: origen === "fisica" ? "Tienda física" : "Online",
    referenciaPago: order.payment_reference,
    boleta: taxStatusLabel(order.tax_status),
    puntos: Number(order.points_earned ?? 0),
    loyaltyStatus: order.loyalty_status,
    shopifyOrderId: order.shopify_order_id,
    detalleCanal: order.sale_channel_detail,
    productos: Array.isArray(metadata.items)
      ? metadata.items.map((item) => ({
          nombre: [item.productTitle, item.variantTitle]
            .filter((part) => part && part !== "Default Title")
            .join(" · "),
          qty: Number(item.quantity ?? 0),
          precio: clp(Number(item.unitPrice ?? 0)),
          pagado: clp(
            Number(
              item.paidTotal ??
                Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
            ),
          ),
          elegible: item.eligible !== false,
        }))
      : [],
    montoElegible: clp(
      Number(order.eligible_total ?? metadata.eligible_total ?? 0),
    ),
    montoExcluido: clp(
      Number(order.excluded_total ?? metadata.excluded_amount ?? 0),
    ),
    reglaAplicada:
      metadata.rule?.name ||
      (order.spending_unit_clp && order.points_per_unit
        ? `${order.points_per_unit} punto(s) cada ${clp(order.spending_unit_clp)}`
        : "Sin snapshot de regla"),
  };
}

async function getRecentPointMovements(): Promise<
  AdminPanelData["pointMovements"]
> {
  let response;

  try {
    response = await getSupabaseAdmin()
      .from("loyalty_transactions")
      .select(
        "id, transaction_type, points, source, description, created_at, loyalty_customers(full_name,email)",
      )
      .order("created_at", { ascending: false })
      .limit(30);
  } catch (error) {
    console.error("No se pudieron cargar movimientos de puntos:", error);
    return [];
  }

  const { data, error } = response;

  if (error) {
    console.error("No se pudieron cargar movimientos de puntos:", error);
    return [];
  }

  return ((data ?? []) as Array<Record<string, any>>).map((item) => {
    const customer = Array.isArray(item.loyalty_customers)
      ? item.loyalty_customers[0]
      : item.loyalty_customers;
    return {
      id: Number(item.id),
      tipo: movementType(String(item.transaction_type)),
      cliente: customer?.full_name ?? customer?.email ?? "Cliente OLFFY",
      fecha: dateLabel(String(item.created_at)),
      fechaISO: String(item.created_at),
      puntos: Number(item.points ?? 0),
      origen: sourceLabel(String(item.source)) as
        | "Shopify"
        | "TUU"
        | "Canje"
        | "Admin",
      estado: item.transaction_type === "reversed" ? "Reversado" : "Aprobado",
    };
  });
}

async function getShopifyAdminUrl() {
  const domain =
    process.env.SHOPIFY_ADMIN_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    "olffy.myshopify.com";
  const store = domain
    .replace(/^https?:\/\//, "")
    .replace(".myshopify.com", "")
    .replace(/\/$/, "");
  return `https://admin.shopify.com/store/${store}`;
}

export async function getAdminPanelData(options?: {
  scope?: "all" | "pos";
}): Promise<AdminPanelData> {
  const posOnly = options?.scope === "pos";
  const [
    frontend,
    orderRefs,
    rewards,
    pointMovements,
    loyaltyRuleResult,
    abandonedCheckouts,
  ] = await Promise.all([
    getFrontendAdminData(),
    posOnly
      ? Promise.resolve([])
      : listOrderReferences(100).catch((error) => {
          console.error("No se pudieron cargar las ventas:", error);
          return [];
        }),
    listRewards(false).catch((error) => {
      console.error("No se pudieron cargar recompensas:", error);
      return [];
    }),
    posOnly ? Promise.resolve([]) : getRecentPointMovements(),
    getActiveLoyaltyRule().catch((error) => {
      console.error("No se pudo cargar la regla activa de puntos:", error);
      return null;
    }),
    posOnly
      ? Promise.resolve({
          available: false,
          source: "shopify" as const,
          fetchedAt: new Date().toISOString(),
          count: 0,
          totalAmount: 0,
          checkouts: [],
        })
      : getAbandonedCheckoutsSummary(),
  ]);

  const customers = frontend.customers.map((customer, index) => ({
    idx: Number(customer.id) || index + 1,
    nombre: customer.name || customer.fullName || customer.email,
    email: customer.email,
    tel: customer.phone || "",
    puntos: customer.points ?? customer.pointsBalance ?? 0,
    estado: customer.status === "active" ? "Activo" : "Bloqueado",
    createdAt: customer.createdAt,
  }));

  const products = frontend.products.map((product, index) => {
    const variant = product.variants?.[0];
    const stock =
      product.stock ??
      product.quantityAvailable ??
      variant?.quantityAvailable ??
      0;
    return {
      id: index + 1,
      name: product.title,
      cat: product.category ?? product.tags?.[0] ?? "Catálogo",
      price: clp(product.price),
      n: product.price,
      tag: product.status === "active" ? ("" as const) : ("Nuevo" as const),
      bg: productBackgrounds[index % productBackgrounds.length] ?? "#DEDDF2",
      colors: [],
      specs: [
        { l: "ESTADO", v: product.status?.toUpperCase?.() ?? "ACTIVE" },
        { l: "STOCK", v: `${stock} unidades` },
      ],
      bundle: null,
      image: product.image || product.images?.[0] || undefined,
      images: product.images ?? [],
      desc:
        product.description?.replace(/<[^>]*>/g, "") ||
        "Producto sincronizado desde Shopify.",
      handle: product.handle,
      shopifyId: product.id,
      variantId: product.variantId ?? variant?.id,
      variants: product.variants ?? [],
      sinPuntos: product.excludeFromPoints === true,
      status: product.status?.toUpperCase?.() ?? "ACTIVE",
      stock,
    };
  });

  const adminProducts = products.map((product) => ({
    nombre: product.name,
    handle: product.handle || product.name.toLowerCase().replace(/\s+/g, "-"),
    estado: product.status || "ACTIVE",
    stock: `${product.stock ?? 0} en stock`,
    precio: product.price,
  }));

  const collections = frontend.collections.map((collection) => ({
    id: collection.id,
    nombre: collection.title,
    handle: collection.handle,
    productos: collection.productsCount.count,
  }));

  const redemptions = frontend.redemptions.map((redemption) => ({
    id: redemption.id,
    beneficio: redemption.rewardTitle,
    pts: `${redemption.pointsCost.toLocaleString("es-CL")} pts · ${redemption.code ?? "sin código"}`,
    cliente:
      customers.find(
        (customer) => String(customer.idx) === String(redemption.customerId),
      )?.nombre ?? "Cliente OLFFY",
    fecha: dateLabel(redemption.requestedAt),
    estado:
      redemption.status === "approved"
        ? "Aprobado"
        : redemption.status === "cancelled"
          ? "Cancelado"
          : redemption.status === "delivered"
            ? "Usado"
            : "Solicitado",
  }));

  const physicalSalesHistory = frontend.physicalSales.map((sale) => ({
    id: Number(sale.id) || Date.now(),
    folio: sale.boletaFolio || sale.id,
    total: clp(sale.amount),
    pts: `+${sale.pointsEarned.toLocaleString("es-CL")} pts`,
    cliente: sale.customerName || sale.customerEmail || "Venta sin cliente",
    responsable: sale.operatorName || "Equipo OLFFY",
  }));

  const sales = orderRefs
    .map(toUnifiedSale)
    .sort((a, b) => Date.parse(b.fechaISO) - Date.parse(a.fechaISO));
  const todayKey = chileDayKey(new Date());
  const salesTodayList = sales.filter(
    (sale) => chileDayKey(sale.fechaISO) === todayKey,
  );
  const salesTodayPaid = salesTodayList.filter(
    (sale) => sale.estadoPago === "Pagado",
  );
  const salesTodayTotal = salesTodayPaid.reduce(
    (sum, sale) => sum + sale.totalN,
    0,
  );
  const onlineToday = salesTodayPaid.filter(
    (sale) => sale.origen === "online",
  ).length;
  const fisicasToday = salesTodayPaid.filter(
    (sale) => sale.origen === "fisica",
  ).length;

  const dashboardMetrics = [
    {
      label: "Ventas hoy",
      value: clp(salesTodayTotal),
      footnote: `${onlineToday} online · ${fisicasToday} físicas`,
      color: "morado",
    },
    {
      label: "Pedidos pendientes",
      value: orderRefs.filter((order) => order.tax_status === "pending").length,
      footnote: "por revisar",
      color: "amarillo",
    },
    {
      label: "Clientes activos",
      value: frontend.dashboard.activeCustomersCount,
      footnote: "registrados",
      color: "morado-suave",
    },
    {
      label: "Puntos en circulación",
      value: frontend.dashboard.outstandingPoints.toLocaleString("es-CL"),
      footnote: "disponibles",
      color: "amarillo-suave",
    },
  ];

  return {
    posReadiness: {
      shopify: Boolean(
        process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
          (process.env.SHOPIFY_ADMIN_API_CLIENT_ID?.trim() &&
            process.env.SHOPIFY_ADMIN_API_CLIENT_SECRET?.trim()),
      ),
      discounts: Boolean(
        process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
          (process.env.SHOPIFY_ADMIN_API_CLIENT_ID?.trim() &&
            process.env.SHOPIFY_ADMIN_API_CLIENT_SECRET?.trim()),
      ),
      tuuRemote:
        process.env.TUU_REMOTE_POS_ENABLED?.trim().toLowerCase() === "true" &&
        Boolean(
          process.env.TUU_POS_API_KEY?.trim() &&
            process.env.TUU_POS_DEVICE_UUID?.trim() &&
            process.env.TUU_POS_DEVICE_SERIAL?.trim(),
        ),
      tuuWebhook: Boolean(process.env.TUU_POS_WEBHOOK_SECRET?.trim()),
      shopifyWebhooks: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET?.trim()),
    },
    adminData: {
      clientes: customers,
      canjesPendientes: redemptions.filter(
        (redemption) => redemption.estado === "Solicitado",
      ),
      historialCliente: pointMovements.slice(0, 10).map((movement) => ({
        fecha: movement.fecha,
        movimiento: movement.tipo,
        puntos: `${movement.puntos >= 0 ? "+" : ""}${movement.puntos.toLocaleString("es-CL")}`,
        saldo: "",
        detalle: `${movement.cliente} · ${movement.origen}`,
      })),
      productos: adminProducts,
      colecciones: collections,
    },
    dashboardMetrics,
    products,
    sales,
    loyaltyRule: loyaltyRuleResult
      ? {
          id: loyaltyRuleResult.id,
          name: loyaltyRuleResult.name,
          spendingUnitClp: loyaltyRuleResult.spending_unit_clp,
          pointsPerUnit: loyaltyRuleResult.points_per_unit,
          pointRedemptionValueClp: loyaltyRuleResult.point_redemption_value_clp,
        }
      : null,
    physicalSalesHistory,
    pointMovements,
    abandonedCheckouts,
    rewards: rewards.map((reward) => ({
      id: reward.id,
      nombre: reward.name,
      puntos: reward.points_cost,
      estado: reward.is_active ? "Activa" : "Pausada",
      descripcion:
        reward.description || "Recompensa sincronizada desde Supabase.",
      shopifyCode:
        typeof (
          reward.metadata?.shopify_template_discount as Record<
            string,
            unknown
          > | null
        )?.code === "string"
          ? String(
              (
                reward.metadata.shopify_template_discount as Record<
                  string,
                  unknown
                >
              ).code,
            )
          : undefined,
      rewardType: reward.reward_type,
      discountAmountClp: Number(reward.discount_amount_clp ?? 0),
      minimumPurchaseClp: Number(reward.minimum_purchase_clp ?? 0),
      validityDays: Number(reward.validity_days ?? 30),
    })),
    shopifyAdminUrl: await getShopifyAdminUrl(),
  };
}
