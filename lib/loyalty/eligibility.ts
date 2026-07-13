import "server-only";

import { adminFetch } from "../shopify/admin";

export const LOYALTY_METAFIELD_NAMESPACE = "olffy";
export const LOYALTY_METAFIELD_KEY = "exclude_from_points";

export type ShopifyBooleanMetafield = {
  value?: string | null;
  jsonValue?: unknown;
} | null;

/** Solo el booleano verdadero excluye; false, null o ausencia participan. */
export function isExcludedFromPointsMetafield(
  metafield: ShopifyBooleanMetafield | boolean | undefined,
): boolean {
  if (typeof metafield === "boolean") return metafield;
  if (!metafield) return false;
  if (typeof metafield.jsonValue === "boolean") return metafield.jsonValue;
  return metafield.value?.trim().toLowerCase() === "true";
}

type ProductEligibilityQuery = {
  data?: {
    nodes?: Array<{
      id?: string;
      excludeFromPoints?: ShopifyBooleanMetafield;
    } | null> | null;
  };
};

const productEligibilityQuery = /* GraphQL */ `
  query olffyProductPointEligibility($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        excludeFromPoints: metafield(
          namespace: "olffy"
          key: "exclude_from_points"
        ) {
          value
          jsonValue
        }
      }
    }
  }
`;

export async function getProductPointEligibility(
  productIds: string[],
): Promise<Map<string, boolean>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  const eligibility = new Map<string, boolean>();

  for (let index = 0; index < uniqueIds.length; index += 50) {
    const batch = uniqueIds.slice(index, index + 50);
    const response = await adminFetch<ProductEligibilityQuery>({
      query: productEligibilityQuery,
      variables: { ids: batch } as never,
    });

    for (const node of response.body.data?.nodes ?? []) {
      if (node?.id) {
        eligibility.set(
          node.id,
          !isExcludedFromPointsMetafield(node.excludeFromPoints),
        );
      }
    }
  }

  return eligibility;
}

export async function getExcludedProductIds(
  productIds: string[],
): Promise<Set<string>> {
  const eligibility = await getProductPointEligibility(productIds);
  return new Set(
    [...eligibility.entries()]
      .filter(([, eligible]) => !eligible)
      .map(([productId]) => productId),
  );
}
