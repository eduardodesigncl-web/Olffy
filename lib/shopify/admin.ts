import { ensureStartsWith } from "lib/utils";
import { isShopifyError } from "lib/type-guards";
import type {
  AdminConnection,
  AdminProduct,
  AdminProductsOperation,
  AdminProductOperation,
  AdminCollection,
  AdminCollectionsOperation,
  AdminCollectionOperation,
} from "./admin-types";

const shopifyStoreDomain =
  process.env.SHOPIFY_STORE_DOMAIN?.trim() ||
  process.env.SHOPIFY_STORE_DOMINIO?.trim();
const domain = shopifyStoreDomain
  ? ensureStartsWith(shopifyStoreDomain, "https://")
  : "";
const adminApiVersion =
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || "2026-04";
// La Admin API usa un endpoint diferente
const endpoint = domain
  ? `${domain}/admin/api/${adminApiVersion}/graphql.json`
  : "";
const configuredAdminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim();
const adminClientId =
  process.env.SHOPIFY_ADMIN_API_CLIENT_ID?.trim() ||
  process.env.SHOPIFY_API_KEY?.trim();
const adminClientSecret =
  process.env.SHOPIFY_ADMIN_API_CLIENT_SECRET?.trim() ||
  process.env.SHOPIFY_API_SECRET?.trim() ||
  (configuredAdminToken?.startsWith("shpss_")
    ? configuredAdminToken
    : undefined);

let cachedAdminToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

type ExtractVariables<T> = T extends { variables: object }
  ? T["variables"]
  : never;

const adminAccessDeniedHelp =
  "El token no tiene permisos Admin API suficientes para ese recurso. " +
  "El token de automatizacion de la app no sirve como Admin API access token. " +
  "Usa un Admin API access token generado desde una Custom App instalada en Shopify Admin con read_products/write_products, " +
  "o implementa OAuth si estas usando una app del Dev Dashboard.";

function formatGraphQLError(error: any) {
  const code = error?.extensions?.code;
  const field = error?.path?.join(".");
  const message = error?.message || "GraphQL error";
  const details = [
    message,
    code ? `code: ${code}` : "",
    field ? `field: ${field}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (code === "ACCESS_DENIED") {
    return `${details}. ${adminAccessDeniedHelp}`;
  }

  return details;
}

async function getAdminAccessToken(): Promise<string> {
  if (configuredAdminToken && !configuredAdminToken.startsWith("shpss_")) {
    return configuredAdminToken;
  }

  if (!adminClientId || !adminClientSecret) {
    if (configuredAdminToken?.startsWith("shpss_")) {
      throw new Error(
        "SHOPIFY_ADMIN_API_ACCESS_TOKEN contiene un Client Secret (shpss_), no un access token. Configura SHOPIFY_ADMIN_API_CLIENT_ID y SHOPIFY_ADMIN_API_CLIENT_SECRET con credenciales de la misma app instalada.",
      );
    }

    throw new Error(
      "Falta SHOPIFY_ADMIN_API_ACCESS_TOKEN o el par SHOPIFY_ADMIN_API_CLIENT_ID y SHOPIFY_ADMIN_API_CLIENT_SECRET.",
    );
  }

  if (
    cachedAdminToken &&
    cachedAdminToken.expiresAt > Date.now() + 5 * 60 * 1000
  ) {
    return cachedAdminToken.accessToken;
  }

  if (!domain) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN environment variable is not set. SHOPIFY_STORE_DOMINIO is also accepted as a fallback.",
    );
  }

  const tokenResponse = await fetch(`${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: adminClientId,
      client_secret: adminClientSecret,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    throw new Error(
      `Shopify no pudo autenticar las credenciales de la app (${tokenResponse.status}). Verifica que el Client ID y Client Secret pertenezcan a la misma app y que esa app este instalada en la tienda.`,
    );
  }

  const tokenBody = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!tokenBody.access_token) {
    throw new Error("Shopify no devolvio un access token para la Admin API.");
  }

  cachedAdminToken = {
    accessToken: tokenBody.access_token,
    expiresAt: Date.now() + (tokenBody.expires_in ?? 86_399) * 1000,
  };

  return cachedAdminToken.accessToken;
}

export async function adminFetch<T>({
  headers,
  query,
  variables,
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    if (!endpoint) {
      throw new Error(
        "SHOPIFY_STORE_DOMAIN environment variable is not set. SHOPIFY_STORE_DOMINIO is also accepted as a fallback.",
      );
    }

    const adminToken = await getAdminAccessToken();

    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
        ...headers,
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables }),
      }),
    });

    const body = await result.json();

    if (!result.ok) {
      const message =
        body?.errors?.[0]?.message ||
        body?.error ||
        body?.message ||
        result.statusText;
      throw new Error(`Shopify Admin API ${result.status}: ${message}`);
    }

    if (body.errors) {
      throw new Error(formatGraphQLError(body.errors[0]));
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }

    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || "unknown",
        status: e.status || 500,
        message: e.message,
        query,
      };
    }

    throw {
      error: e,
      query,
    };
  }
}

const removeEdgesAndNodes = <T>(array: AdminConnection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

// --- QUERIES ---

const checkAdminShopifyConnectionQuery = /* GraphQL */ `
  query checkAdminShopifyConnection {
    shop {
      name
      myshopifyDomain
    }
  }
`;

const getProductsQuery = /* GraphQL */ `
  query getAdminProducts($first: Int!, $query: String) {
    products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          status
          createdAt
          updatedAt
          descriptionHtml
          tags
          images(first: 1) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

const getProductQuery = /* GraphQL */ `
  query getAdminProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      createdAt
      updatedAt
      descriptionHtml
      tags
      images(first: 5) {
        edges {
          node {
            id
            url
            altText
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            price
            inventoryQuantity
          }
        }
      }
    }
  }
`;

const getCollectionsQuery = /* GraphQL */ `
  query getAdminCollections($first: Int!) {
    collections(first: $first, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          handle
          updatedAt
          productsCount {
            count
          }
        }
      }
    }
  }
`;

// --- MUTATIONS ---

const productCreateMutation = /* GraphQL */ `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const productUpdateMutation = /* GraphQL */ `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const productDeleteMutation = /* GraphQL */ `
  mutation productDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

const getCollectionQuery = /* GraphQL */ `
  query getAdminCollection($id: ID!) {
    collection(id: $id) {
      id
      title
      handle
      updatedAt
      productsCount {
        count
      }
    }
  }
`;

const collectionCreateMutation = /* GraphQL */ `
  mutation collectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const collectionUpdateMutation = /* GraphQL */ `
  mutation collectionUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const collectionDeleteMutation = /* GraphQL */ `
  mutation collectionDelete($input: CollectionDeleteInput!) {
    collectionDelete(input: $input) {
      deletedCollectionId
      userErrors {
        field
        message
      }
    }
  }
`;

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const res = await adminFetch<AdminProductsOperation>({
    query: getProductsQuery,
    variables: { first: 50 },
  });
  return removeEdgesAndNodes(res.body.data.products);
}

export async function checkAdminShopifyConnection(): Promise<{
  name: string;
  myshopifyDomain: string;
}> {
  const res = await adminFetch<{
    data: {
      shop: {
        name: string;
        myshopifyDomain: string;
      };
    };
  }>({
    query: checkAdminShopifyConnectionQuery,
  });

  return res.body.data.shop;
}

export async function getAdminProduct(
  id: string,
): Promise<AdminProduct | null> {
  const res = await adminFetch<AdminProductOperation>({
    query: getProductQuery,
    variables: { id },
  });
  return res.body.data.product || null;
}

export async function createAdminProduct(input: any): Promise<any> {
  const res = await adminFetch<any>({
    query: productCreateMutation,
    variables: { input },
  });
  return res.body.data.productCreate;
}

export async function updateAdminProduct(input: any): Promise<any> {
  const res = await adminFetch<any>({
    query: productUpdateMutation,
    variables: { input },
  });
  return res.body.data.productUpdate;
}

export async function deleteAdminProduct(id: string): Promise<any> {
  const res = await adminFetch<any>({
    query: productDeleteMutation,
    variables: { input: { id } },
  });
  return res.body.data.productDelete;
}

export async function getAdminCollections(): Promise<AdminCollection[]> {
  const res = await adminFetch<AdminCollectionsOperation>({
    query: getCollectionsQuery,
    variables: { first: 50 },
  });
  return removeEdgesAndNodes(res.body.data.collections);
}

export async function getAdminCollection(
  id: string,
): Promise<AdminCollection | null> {
  const res = await adminFetch<AdminCollectionOperation>({
    query: getCollectionQuery,
    variables: { id },
  });
  return res.body.data.collection || null;
}

export async function createAdminCollection(input: any): Promise<any> {
  const res = await adminFetch<any>({
    query: collectionCreateMutation,
    variables: { input },
  });
  return res.body.data.collectionCreate;
}

export async function updateAdminCollection(input: any): Promise<any> {
  const res = await adminFetch<any>({
    query: collectionUpdateMutation,
    variables: { input },
  });
  return res.body.data.collectionUpdate;
}

export async function deleteAdminCollection(id: string): Promise<any> {
  const res = await adminFetch<any>({
    query: collectionDeleteMutation,
    variables: { input: { id } },
  });
  return res.body.data.collectionDelete;
}
