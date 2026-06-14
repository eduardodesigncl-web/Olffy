export type ShopifyResourceType = "Collection" | "Customer" | "Product";

function decodeShopifyId(id: string) {
  const trimmed = id.trim();

  if (!trimmed) {
    throw new Error("Shopify ID is required.");
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    throw new Error("Shopify ID is not URL encoded correctly.");
  }
}

export function normalizeShopifyGid(
  resourceType: ShopifyResourceType,
  id: string,
) {
  const decodedId = decodeShopifyId(id);
  const gidMatch = decodedId.match(/^gid:\/\/shopify\/([^/]+)\/(.+)$/);

  if (gidMatch) {
    const [, actualResourceType, resourceId] = gidMatch;

    if (actualResourceType !== resourceType) {
      throw new Error(
        `Expected a Shopify ${resourceType} ID, received ${actualResourceType}.`,
      );
    }

    if (!resourceId || /[/?#\s]/.test(resourceId)) {
      throw new Error(`Invalid Shopify ${resourceType} ID.`);
    }

    return decodedId;
  }

  const resourcePrefix = `${resourceType}/`;
  const resourceId = decodedId.startsWith(resourcePrefix)
    ? decodedId.slice(resourcePrefix.length)
    : decodedId;

  if (!resourceId || /[/?#\s]/.test(resourceId)) {
    throw new Error(`Invalid Shopify ${resourceType} ID.`);
  }

  return `gid://shopify/${resourceType}/${resourceId}`;
}
