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
  source: "shopify";
  fetchedAt: string;
  count: number;
  totalAmount: number;
  checkouts: AbandonedCheckoutRow[];
  error?: string;
};

type AbandonedCheckoutsQuery = {
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
          customer?: { email?: string | null } | null;
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

const query = /* GraphQL */ `
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
            email
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

// Carritos/checkouts abandonados desde Shopify nativo (fuente inicial según
// el plan; Klaviyo podrá complementar cuando esté contratado). Si el Admin API
// no está disponible, se reporta explícitamente en lugar de inventar datos.
export async function getAbandonedCheckoutsSummary(): Promise<AbandonedCheckoutsSummary> {
  const fetchedAt = new Date().toISOString();

  try {
    const response = await adminFetch<AbandonedCheckoutsQuery>({
      query,
      variables: { first: 25 } as never,
    });

    const edges = response.body.data?.abandonedCheckouts?.edges ?? [];
    const checkouts = edges.map(({ node }) => ({
      id: node.id,
      name: node.name ?? node.id.split("/").pop() ?? "checkout",
      createdAt: node.createdAt,
      totalPrice: Number(node.totalPriceSet?.shopMoney?.amount ?? 0),
      customerEmail: node.customer?.email ?? null,
      lineItems: (node.lineItems?.edges ?? []).map(
        (edge) =>
          `${edge.node.title ?? "Producto"}${
            edge.node.quantity && edge.node.quantity > 1
              ? ` x${edge.node.quantity}`
              : ""
          }`,
      ),
    }));

    return {
      available: true,
      source: "shopify",
      fetchedAt,
      count: checkouts.length,
      totalAmount: checkouts.reduce((sum, item) => sum + item.totalPrice, 0),
      checkouts,
    };
  } catch (error) {
    console.error("No se pudieron cargar checkouts abandonados:", error);
    return {
      available: false,
      source: "shopify",
      fetchedAt,
      count: 0,
      totalAmount: 0,
      checkouts: [],
      error:
        error instanceof Error
          ? error.message
          : "Shopify Admin API no disponible",
    };
  }
}
