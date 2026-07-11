import "server-only";

import { adminFetch } from "lib/shopify/admin";

// Categoría de exclusión de OLFFY Puntos (propuesta v2): todos los productos
// participan por defecto; los marcados manualmente en Shopify con esta
// etiqueta no generan puntos ni cuentan para mínimos de canje.
// El nombre es configurable para no hardcodear múltiples variantes.
const DEFAULT_EXCLUSION_TAG = "Sin puntos";

export function getLoyaltyExclusionTag(): string {
  return process.env.LOYALTY_EXCLUSION_TAG?.trim() || DEFAULT_EXCLUSION_TAG;
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function isExcludedFromLoyalty(
  tags: string[] | null | undefined,
): boolean {
  if (!tags || tags.length === 0) return false;
  const exclusion = normalizeTag(getLoyaltyExclusionTag());
  return tags.some((tag) => normalizeTag(tag) === exclusion);
}

type ProductTagsQuery = {
  data?: {
    nodes?: Array<{ id?: string; tags?: string[] } | null> | null;
  };
};

const productTagsQuery = /* GraphQL */ `
  query olffyProductTags($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        tags
      }
    }
  }
`;

// Consulta los tags de un conjunto de productos y devuelve los IDs excluidos
// del programa. Lanza error si Shopify no responde: es preferible reintentar
// la acreditación de puntos a acreditar sobre productos no elegibles.
export async function getExcludedProductIds(
  productIds: string[],
): Promise<Set<string>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];

  if (uniqueIds.length === 0) return new Set();

  const excluded = new Set<string>();

  for (let index = 0; index < uniqueIds.length; index += 50) {
    const batch = uniqueIds.slice(index, index + 50);
    const response = await adminFetch<ProductTagsQuery>({
      query: productTagsQuery,
      variables: { ids: batch } as never,
    });

    for (const node of response.body.data?.nodes ?? []) {
      if (node?.id && isExcludedFromLoyalty(node.tags)) {
        excluded.add(node.id);
      }
    }
  }

  return excluded;
}

// Reparte proporcionalmente los descuentos de la orden: el monto elegible
// pagado = base pagada (después de descuentos, sin envío) escalada por la
// fracción elegible de las líneas.
export function proportionalEligibleAmount(input: {
  paidBase: number;
  eligibleLineAmount: number;
  totalLineAmount: number;
}): number {
  if (input.totalLineAmount <= 0 || input.paidBase <= 0) return 0;
  const fraction = Math.min(
    Math.max(input.eligibleLineAmount / input.totalLineAmount, 0),
    1,
  );
  return Math.round(input.paidBase * fraction);
}
