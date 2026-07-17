import "server-only";

import { adminFetch } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import type { OrderReference } from "lib/transactions/types";

// Pedidos del cliente para el panel "Mis pedidos" (/cuenta). La fuente de
// verdad de la venta es olffy_order_refs (canal online); el estado logístico
// (preparación / enviado / entregado), las líneas y el tracking se enriquecen
// desde Shopify Admin. Si Shopify no responde, se degrada a la información
// local sin bloquear el panel.

export type CustomerOrderStatus =
  | "recibido"
  | "preparacion"
  | "listo_retiro"
  | "enviado"
  | "entregado";

export type CustomerOrder = {
  id: number;
  numero: string;
  fecha: string;
  total: string;
  estado: CustomerOrderStatus;
  entrega: "retiro" | "envio";
  items: { nombre: string; cantidad: number }[];
  puntos: number;
  tracking?: { codigo: string; transportista: string; url?: string };
  entregadoFecha?: string;
};

type ShopifyOrderNode = {
  id: string;
  name: string | null;
  createdAt: string | null;
  displayFulfillmentStatus: string | null;
  shippingLine: { title: string | null } | null;
  lineItems: { nodes: { title: string | null; quantity: number | null }[] };
  fulfillments: {
    deliveredAt: string | null;
    displayStatus: string | null;
    trackingInfo: {
      number: string | null;
      company: string | null;
      url: string | null;
    }[];
  }[];
};

const customerOrdersQuery = /* GraphQL */ `
  query customerOrders($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Order {
        id
        name
        createdAt
        displayFulfillmentStatus
        shippingLine {
          title
        }
        lineItems(first: 10) {
          nodes {
            title
            quantity
          }
        }
        fulfillments(first: 5) {
          deliveredAt
          displayStatus
          trackingInfo(first: 1) {
            number
            company
            url
          }
        }
      }
    }
  }
`;

function formatClp(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CL");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Santiago",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function baseStatus(ref: OrderReference): CustomerOrderStatus {
  return ref.payment_status === "confirmed" ? "preparacion" : "recibido";
}

function enrichedStatus(
  ref: OrderReference,
  node: ShopifyOrderNode,
): { estado: CustomerOrderStatus; entrega: "retiro" | "envio" } {
  const entrega: "retiro" | "envio" = node.shippingLine ? "envio" : "retiro";
  const delivered =
    node.fulfillments.some(
      (f) => f.deliveredAt || f.displayStatus === "DELIVERED",
    ) || node.displayFulfillmentStatus === "FULFILLED";
  const shipped = node.fulfillments.length > 0;

  if (entrega === "envio") {
    if (delivered && node.fulfillments.some((f) => f.deliveredAt)) {
      return { estado: "entregado", entrega };
    }
    if (shipped) return { estado: "enviado", entrega };
    return { estado: baseStatus(ref), entrega };
  }

  // Retiro en tienda: la "entrega" (fulfillment) marca el retiro efectivo;
  // el estado intermedio es "listo para retiro" cuando la orden ya se preparó.
  if (delivered) return { estado: "entregado", entrega };
  if (node.displayFulfillmentStatus === "ON_HOLD" || shipped) {
    return { estado: "listo_retiro", entrega };
  }
  return { estado: baseStatus(ref), entrega };
}

async function fetchShopifyOrders(
  ids: string[],
): Promise<Map<string, ShopifyOrderNode>> {
  const map = new Map<string, ShopifyOrderNode>();
  if (!ids.length) return map;

  try {
    const response = await adminFetch<{
      data: { nodes: (ShopifyOrderNode | null)[] };
    }>({
      query: customerOrdersQuery,
      variables: { ids } as never,
    });

    for (const node of response.body.data?.nodes ?? []) {
      if (node?.id) map.set(node.id, node);
    }
  } catch (cause) {
    console.error(
      "No se pudieron enriquecer los pedidos desde Shopify:",
      cause,
    );
  }

  return map;
}

function normalizeOrderGid(raw: string): string {
  if (raw.startsWith("gid://shopify/")) return raw;
  if (/^\d+$/.test(raw)) return `gid://shopify/Order/${raw}`;
  return raw;
}

export async function getCustomerOrders(
  customerId: number,
  limit = 10,
): Promise<CustomerOrder[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .eq("loyalty_customer_id", customerId)
    .eq("channel", "online")
    .in("payment_status", ["confirmed", "pending", "manual_review"])
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 25));

  if (error) {
    console.error("No se pudieron cargar los pedidos del cliente:", error);
    return [];
  }

  const refs = (data ?? []) as (OrderReference & { created_at?: string })[];
  const gids = refs
    .map((ref) =>
      ref.shopify_order_id ? normalizeOrderGid(ref.shopify_order_id) : null,
    )
    .filter((id): id is string => Boolean(id));
  const shopifyOrders = await fetchShopifyOrders(gids);

  return refs.map((ref, index) => {
    const node = ref.shopify_order_id
      ? shopifyOrders.get(normalizeOrderGid(ref.shopify_order_id))
      : undefined;

    const { estado, entrega } = node
      ? enrichedStatus(ref, node)
      : { estado: baseStatus(ref), entrega: "envio" as const };

    const deliveredAt = node?.fulfillments.find((f) => f.deliveredAt)
      ?.deliveredAt;
    const trackingInfo = node?.fulfillments
      .flatMap((f) => f.trackingInfo)
      .find((info) => info.number);

    return {
      id: index + 1,
      numero:
        ref.shopify_order_name ??
        node?.name ??
        `Pedido ${ref.olffy_reference}`,
      fecha: formatDate(node?.createdAt ?? ref.created_at),
      total: formatClp(ref.total),
      estado,
      entrega,
      items: (node?.lineItems.nodes ?? []).map((item) => ({
        nombre: item.title ?? "Producto OLFFY",
        cantidad: Math.max(Number(item.quantity ?? 1), 1),
      })),
      puntos: ref.points_earned,
      ...(trackingInfo?.number
        ? {
            tracking: {
              codigo: trackingInfo.number,
              transportista: trackingInfo.company ?? "Transportista",
              ...(trackingInfo.url ? { url: trackingInfo.url } : {}),
            },
          }
        : {}),
      ...(deliveredAt ? { entregadoFecha: formatDate(deliveredAt) } : {}),
    };
  });
}
