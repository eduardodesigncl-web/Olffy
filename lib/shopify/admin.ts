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

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, "https://")
  : "";
// La Admin API usa un endpoint diferente
const endpoint = domain ? `${domain}/admin/api/2025-01/graphql.json` : "";
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

type ExtractVariables<T> = T extends { variables: object }
  ? T["variables"]
  : never;

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
      throw new Error("SHOPIFY_STORE_DOMAIN environment variable is not set");
    }
    if (!adminToken) {
      throw new Error("SHOPIFY_ADMIN_API_ACCESS_TOKEN environment variable is not set");
    }

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

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
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
                inventoryItem {
                  id
                  inventoryLevels(first: 5) {
                    edges {
                      node {
                        id
                        available
                        location {
                          id
                          name
                        }
                      }
                    }
                  }
                }
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
            inventoryItem {
              id
              inventoryLevels(first: 5) {
                edges {
                  node {
                    id
                    available
                    location {
                      id
                      name
                    }
                  }
                }
              }
            }
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

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
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

export async function getAdminCollection(id: string): Promise<AdminCollection | null> {
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
