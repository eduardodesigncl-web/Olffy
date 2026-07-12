import "server-only";

import { adminFetch } from "lib/shopify/admin";

export type AbandonedCheckoutRow = {
  id: string;
  name: string;
  createdAt: string;
  totalPrice: number;
  customerEmail: string | null;
  lineItems: string[];
};

export type AbandonedCheckoutsSummary = {
  available: boolean;
  source: "klaviyo" | "shopify";
  fetchedAt: string;
  count: number;
  totalAmount: number;
  checkouts: AbandonedCheckoutRow[];
  error?: string;
};

type KlaviyoMetricResponse = {
  data: Array<{
    id: string;
    attributes: { name: string };
  }>;
};

type KlaviyoEventProperties = Record<string, unknown> & {
  Items?: unknown;
  $value?: unknown;
  "Source Name"?: unknown;
  $extra?: Record<string, unknown>;
};

type KlaviyoEventResponse = {
  data: Array<{
    id: string;
    attributes: {
      datetime: string;
      event_properties?: KlaviyoEventProperties;
      eventProperties?: KlaviyoEventProperties;
    };
    relationships?: {
      profile?: { data?: { id?: string } | null };
    };
  }>;
  included?: Array<{
    type: string;
    id: string;
    attributes?: { email?: string | null };
  }>;
};

type ShopifyAbandonedCheckoutsQuery = {
  data?: {
    abandonedCheckouts?: {
      edges: Array<{
        node: {
          id: string;
          name?: string | null;
          createdAt: string;
          totalPriceSet?: {
            shopMoney?: { amount?: string | null } | null;
          } | null;
          customer?: {
            defaultEmailAddress?: { emailAddress?: string | null } | null;
          } | null;
          lineItems?: {
            edges: Array<{
              node: { title?: string | null; quantity?: number | null };
            }>;
          } | null;
        };
      }>;
    };
  };
};

const shopifyQuery = /* GraphQL */ `
  query OlffyAbandonedCheckouts($first: Int!) {
    abandonedCheckouts(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
            }
          }
          customer {
            defaultEmailAddress {
              emailAddress
            }
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

const KLAVIYO_API_URL = "https://a.klaviyo.com/api";
const ABANDONMENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const ACTIVE_CHECKOUT_GRACE_MS = 60 * 60 * 1000;

function klaviyoHeaders(apiKey: string) {
  return {
    accept: "application/vnd.api+json",
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision: process.env.KLAVIYO_REVISION?.trim() || "2026-04-15",
  };
}

async function klaviyoGet<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const search = new URLSearchParams(params);
  const response = await fetch(`${KLAVIYO_API_URL}/${path}?${search}`, {
    headers: klaviyoHeaders(apiKey),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Klaviyo respondió ${response.status}: ${await response.text()}`,
    );
  }

  return (await response.json()) as T;
}

function propertiesOf(
  event: KlaviyoEventResponse["data"][number],
): KlaviyoEventProperties {
  return (
    event.attributes.event_properties ?? event.attributes.eventProperties ?? {}
  );
}

function checkoutToken(properties: KlaviyoEventProperties): string | null {
  const extra = properties["$extra"] ?? {};
  const value =
    extra.token ??
    extra.checkout_token ??
    properties.checkout_token ??
    properties.CheckoutToken;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function lineItems(properties: KlaviyoEventProperties): string[] {
  return Array.isArray(properties.Items)
    ? properties.Items.filter(
        (item): item is string => typeof item === "string" && Boolean(item),
      )
    : [];
}

async function getKlaviyoAbandonedCheckouts(
  apiKey: string,
): Promise<AbandonedCheckoutsSummary> {
  const fetchedAt = new Date().toISOString();
  const metrics = await klaviyoGet<KlaviyoMetricResponse>(
    "metrics",
    {
      filter: 'equals(integration.name,"Shopify")',
      "fields[metric]": "name",
    },
    apiKey,
  );
  const startedMetric = metrics.data.find(
    (metric) => metric.attributes.name === "Checkout Started",
  );
  const placedMetric = metrics.data.find(
    (metric) => metric.attributes.name === "Placed Order",
  );

  if (!startedMetric || !placedMetric) {
    throw new Error(
      "Klaviyo no expone las métricas Shopify Checkout Started y Placed Order",
    );
  }

  const eventParams = (metricId: string) => ({
    filter: `equals(metric_id,"${metricId}")`,
    sort: "-datetime",
    "fields[event]": "datetime,event_properties",
    "fields[profile]": "email",
    include: "profile",
    "page[size]": "100",
  });
  const [started, placed] = await Promise.all([
    klaviyoGet<KlaviyoEventResponse>(
      "events",
      eventParams(startedMetric.id),
      apiKey,
    ),
    klaviyoGet<KlaviyoEventResponse>(
      "events",
      eventParams(placedMetric.id),
      apiKey,
    ),
  ]);

  const completedTokens = new Set(
    placed.data
      .map((event) => checkoutToken(propertiesOf(event)))
      .filter((token): token is string => Boolean(token)),
  );
  const profileEmails = new Map(
    (started.included ?? [])
      .filter((item) => item.type === "profile")
      .map((item) => [item.id, item.attributes?.email ?? null] as const),
  );
  const now = Date.now();
  const unique = new Map<string, AbandonedCheckoutRow>();

  for (const event of started.data) {
    const properties = propertiesOf(event);
    const token = checkoutToken(properties);
    const createdAt = Date.parse(event.attributes.datetime);
    const source = properties["Source Name"];

    if (
      !token ||
      unique.has(token) ||
      completedTokens.has(token) ||
      source === "pos" ||
      !Number.isFinite(createdAt) ||
      now - createdAt < ACTIVE_CHECKOUT_GRACE_MS ||
      now - createdAt > ABANDONMENT_WINDOW_MS
    ) {
      continue;
    }

    const profileId = event.relationships?.profile?.data?.id;
    const amount = Number(properties["$value"] ?? 0);
    unique.set(token, {
      id: event.id,
      name: `Checkout ${token.slice(0, 8)}`,
      createdAt: event.attributes.datetime,
      totalPrice: Number.isFinite(amount) ? amount : 0,
      customerEmail: profileId ? (profileEmails.get(profileId) ?? null) : null,
      lineItems: lineItems(properties),
    });
  }

  const checkouts = [...unique.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return {
    available: true,
    source: "klaviyo",
    fetchedAt,
    count: checkouts.length,
    totalAmount: checkouts.reduce((sum, item) => sum + item.totalPrice, 0),
    checkouts,
  };
}

async function getShopifyAbandonedCheckouts(
  klaviyoError?: string,
): Promise<AbandonedCheckoutsSummary> {
  const fetchedAt = new Date().toISOString();
  try {
    const response = await adminFetch<ShopifyAbandonedCheckoutsQuery>({
      query: shopifyQuery,
      variables: { first: 25 } as never,
    });
    const checkouts = (response.body.data?.abandonedCheckouts?.edges ?? []).map(
      ({ node }) => ({
        id: node.id,
        name: node.name ?? node.id.split("/").pop() ?? "checkout",
        createdAt: node.createdAt,
        totalPrice: Number(node.totalPriceSet?.shopMoney?.amount ?? 0),
        customerEmail: node.customer?.defaultEmailAddress?.emailAddress ?? null,
        lineItems: (node.lineItems?.edges ?? []).map(
          (edge) =>
            `${edge.node.title ?? "Producto"}${
              edge.node.quantity && edge.node.quantity > 1
                ? ` x${edge.node.quantity}`
                : ""
            }`,
        ),
      }),
    );

    return {
      available: true,
      source: "shopify",
      fetchedAt,
      count: checkouts.length,
      totalAmount: checkouts.reduce((sum, item) => sum + item.totalPrice, 0),
      checkouts,
      error: klaviyoError,
    };
  } catch (error) {
    return {
      available: false,
      source: "shopify",
      fetchedAt,
      count: 0,
      totalAmount: 0,
      checkouts: [],
      error: [
        klaviyoError,
        error instanceof Error
          ? error.message
          : "Shopify Admin API no disponible",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  }
}

export async function getAbandonedCheckoutsSummary(): Promise<AbandonedCheckoutsSummary> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY?.trim();
  if (apiKey) {
    try {
      return await getKlaviyoAbandonedCheckouts(apiKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Klaviyo no disponible";
      console.error("No se pudieron cargar abandonos desde Klaviyo:", error);
      return getShopifyAbandonedCheckouts(message);
    }
  }

  return getShopifyAbandonedCheckouts(
    "KLAVIYO_PRIVATE_API_KEY no está configurada; se usa Shopify como respaldo",
  );
}
