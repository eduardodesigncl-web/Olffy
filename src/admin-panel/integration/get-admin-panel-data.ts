import "server-only";

import { getFrontendAdminData } from "src/integration/admin-data";
import { listOrderReferences } from "lib/transactions/repository";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { listRewards } from "lib/loyalty/service";
import { getAdminCollections } from "lib/shopify/admin";
import type { AdminPanelData } from "./types";

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
  }).format(new Date(value));
}

function sourceLabel(source: string | null | undefined) {
  if (source === "shopify_order") return "Shopify";
  if (source === "physical_sale") return "TUU";
  if (source === "reward_redemption") return "Canje";
  return "Admin";
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

export async function getAdminPanelData(): Promise<AdminPanelData> {
  const [frontend, orderRefs, rewards, pointMovements, shopifyCollections] =
    await Promise.all([
      getFrontendAdminData(),
      listOrderReferences(50).catch((error) => {
        console.error("No se pudieron cargar ventas digitales:", error);
        return [];
      }),
      listRewards(false).catch((error) => {
        console.error("No se pudieron cargar recompensas:", error);
        return [];
      }),
      getRecentPointMovements(),
      getAdminCollections().catch((error) => {
        console.error("No se pudieron cargar colecciones Shopify:", error);
        return [];
      }),
    ]);

  const customers = frontend.customers.map((customer, index) => ({
    idx: Number(customer.id) || index + 1,
    nombre: customer.name || customer.fullName || customer.email,
    email: customer.email,
    tel: customer.phone || "",
    puntos: customer.points ?? customer.pointsBalance ?? 0,
    estado: customer.status === "active" ? "Activo" : "Bloqueado",
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
      desc:
        product.description?.replace(/<[^>]*>/g, "") ||
        "Producto sincronizado desde Shopify.",
      handle: product.handle,
      shopifyId: product.id,
      variantId: product.variantId ?? variant?.id,
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

  const collections = shopifyCollections.map((collection) => ({
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

  const digitalSales = orderRefs
    .filter((order) => order.channel === "online")
    .map((order, index) => {
      const raw = order as typeof order & {
        customer_email?: string | null;
        payment_provider?: string | null;
      };
      return {
        id: index + 1,
        folio: order.shopify_order_name || order.olffy_reference,
        cliente: raw.customer_email || "Cliente invitado",
        email: raw.customer_email || "invitado@olffy.cl",
        fecha: dateLabel(order.created_at),
        total: clp(Number(order.total ?? 0)),
        totalN: Number(order.total ?? 0),
        metodoPago: raw.payment_provider?.toUpperCase?.() || "TUU",
        estadoPago:
          order.payment_status === "confirmed"
            ? ("Pagado" as const)
            : ("Pendiente" as const),
        canal: "Web / Shopify",
        puntos: 0,
        supabaseSync: order.loyalty_status === "processed",
        productos: [],
      };
    });

  const salesToday = frontend.dashboard.salesToday ?? 0;
  const ordersToday = frontend.dashboard.ordersToday ?? 0;
  const dashboardMetrics = [
    {
      label: "Ventas hoy",
      value: clp(salesToday),
      footnote: `${ordersToday} ventas físicas`,
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
    digitalSales,
    physicalSalesHistory,
    pointMovements,
    rewards: rewards.map((reward) => ({
      id: reward.id,
      nombre: reward.name,
      puntos: reward.points_cost,
      estado: reward.is_active ? "Activa" : "Pausada",
      descripcion:
        reward.description || "Recompensa sincronizada desde Supabase.",
    })),
    shopifyAdminUrl: await getShopifyAdminUrl(),
  };
}
