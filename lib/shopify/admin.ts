import { ensureStartsWith } from "lib/utils";
import { isShopifyError } from "lib/type-guards";
import { normalizeShopifyGid } from "lib/shopify/gid";
import { createHash } from "node:crypto";
import type {
  AdminConnection,
  AdminProduct,
  AdminProductsOperation,
  AdminProductOperation,
  AdminCollection,
  AdminCollectionsOperation,
  AdminCollectionOperation,
} from "./admin-types";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  const unquoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
      ? value.slice(1, -1).trim()
      : value;

  return unquoted || undefined;
}

const OLFFY_SHOPIFY_STOREFRONT_DOMAIN = "olffy.cl";
const OLFFY_SHOPIFY_ADMIN_DOMAIN = "f46f6e-a4.myshopify.com";
const configuredShopifyStoreDomain =
  env("SHOPIFY_s_SHOPIFY_STORE_DOMAIN") ||
  env("SHOPIFY_STORE_DOMAIN") ||
  env("SHOPIFY_STORE_DOMINIO");
const configuredShopifyAdminDomain =
  env("SHOPIFY_ADMIN_STORE_DOMAIN") ||
  env("SHOPIFY_ADMIN_API_STORE_DOMAIN") ||
  env("SHOPIFY_ADMIN_SHOP_DOMAIN") ||
  configuredShopifyStoreDomain;
const normalizedShopifyAdminDomain = configuredShopifyAdminDomain
  ?.replace(/^https?:\/\//, "")
  .replace(/\/$/, "")
  .toLowerCase();
const shopifyAdminDomain =
  normalizedShopifyAdminDomain &&
  normalizedShopifyAdminDomain !== OLFFY_SHOPIFY_STOREFRONT_DOMAIN
    ? normalizedShopifyAdminDomain
    : OLFFY_SHOPIFY_ADMIN_DOMAIN;
const domain = shopifyAdminDomain
  ? ensureStartsWith(shopifyAdminDomain, "https://")
  : "";
const adminApiVersion = env("SHOPIFY_ADMIN_API_VERSION") || "2026-04";
// La Admin API usa un endpoint diferente
const endpoint = domain
  ? `${domain}/admin/api/${adminApiVersion}/graphql.json`
  : "";
const configuredAdminToken =
  env("SHOPIFY_ADMIN_API_ACCESS_TOKEN") || env("SHOPIFY_ADMIN_TOKEN");
const configuredAdminTokenSource = env("SHOPIFY_ADMIN_API_ACCESS_TOKEN")
  ? "SHOPIFY_ADMIN_API_ACCESS_TOKEN"
  : env("SHOPIFY_ADMIN_TOKEN")
    ? "SHOPIFY_ADMIN_TOKEN"
    : undefined;
const adminClientId =
  env("SHOPIFY_ADMIN_API_CLIENT_ID") || env("SHOPIFY_API_KEY");
const adminClientSecret =
  env("SHOPIFY_ADMIN_API_CLIENT_SECRET") || env("SHOPIFY_API_SECRET");

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
  "Para el POS se requieren read_products, read_inventory, read_orders y write_orders. " +
  "Para canjes Shopify se requieren read_discounts y write_discounts. " +
  "Usa un Admin API access token generado desde una Custom App instalada en Shopify Admin con esos permisos, " +
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
  if (configuredAdminToken?.startsWith("shpss_")) {
    throw new Error(
      "SHOPIFY_ADMIN_API_ACCESS_TOKEN contiene un Client Secret (shpss_), no un Admin API access token. En Vercel configura SHOPIFY_ADMIN_API_ACCESS_TOKEN con el token de Admin API de la app instalada (normalmente empieza con shpat_) o elimina esa variable para usar OAuth con SHOPIFY_ADMIN_API_CLIENT_ID y SHOPIFY_ADMIN_API_CLIENT_SECRET validos.",
    );
  }

  if (configuredAdminToken) {
    return configuredAdminToken;
  }

  if (!adminClientId || !adminClientSecret) {
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
      "SHOPIFY_ADMIN_STORE_DOMAIN or SHOPIFY_STORE_DOMAIN environment variable is not set. Use the .myshopify.com domain for Admin API.",
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
        "SHOPIFY_ADMIN_STORE_DOMAIN or SHOPIFY_STORE_DOMAIN environment variable is not set. Use the .myshopify.com domain for Admin API.",
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
      const authHint =
        result.status === 401
          ? ` Revisa ${configuredAdminTokenSource ?? "SHOPIFY_ADMIN_API_ACCESS_TOKEN"} para la tienda ${shopifyAdminDomain}. El token debe pertenecer a esa misma tienda y no debe incluir comillas.`
          : "";
      throw new Error(
        `Shopify Admin API ${result.status}: ${message}.${authHint}`,
      );
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
                sku
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
            sku
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
  mutation productCreate($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        variants(first: 1) {
          nodes {
            id
            price
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const productUpdateMutation = /* GraphQL */ `
  mutation productUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
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

const productVariantsBulkUpdateMutation = /* GraphQL */ `
  mutation productVariantsBulkUpdate(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      productVariants {
        id
        price
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
      products(first: 12) {
        nodes {
          id
          title
          handle
          status
        }
      }
    }
  }
`;

const searchProductVariantsQuery = /* GraphQL */ `
  query searchAdminProductVariants(
    $productsFirst: Int!
    $variantsFirst: Int!
    $query: String!
  ) {
    products(first: $productsFirst, query: $query, sortKey: RELEVANCE) {
      nodes {
        id
        title
        status
        variants(first: $variantsFirst) {
          nodes {
            id
            title
            sku
            price
            inventoryQuantity
          }
        }
      }
    }
  }
`;

type AdminPosProductSearchNode = {
  id: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      sku: string | null;
      price: string;
      inventoryQuantity: number;
    }>;
  };
};

const getProductVariantsByIdsQuery = /* GraphQL */ `
  query getAdminProductVariantsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        sku
        price
        inventoryQuantity
        product {
          id
          title
          status
        }
      }
    }
  }
`;

const findPhysicalOrderQuery = /* GraphQL */ `
  query findPhysicalOrder($query: String!) {
    orders(first: 1, query: $query, reverse: true) {
      nodes {
        id
        name
        displayFinancialStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const createPhysicalOrderMutation = /* GraphQL */ `
  mutation createPhysicalOrder(
    $order: OrderCreateOrderInput!
    $options: OrderCreateOptionsInput
  ) {
    orderCreate(order: $order, options: $options) {
      order {
        id
        name
        displayFinancialStatus
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const updateOlffyOrderMutation = /* GraphQL */ `
  mutation updateOlffyOrder($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type AdminPosVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  inventoryQuantity: number;
  product: {
    id: string;
    title: string;
    status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  };
};

export type AdminPhysicalOrder = {
  id: string;
  name: string;
  displayFinancialStatus: string;
  total: number;
  currencyCode: string;
  reused: boolean;
};

export type CreatePhysicalOrderInput = {
  tuuTransactionId: string;
  olffyReference?: string;
  channel?: "online" | "physical";
  saleChannelDetail?: string;
  receiptNumber?: string;
  responsible: string;
  notes?: string;
  customer?: {
    email: string;
    shopifyCustomerId?: string | null;
  };
  items: Array<{
    variantId: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: {
    code: string;
    amount: number;
  };
  total: number;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
  }>;
};

function physicalOrderTag(reference: string): string {
  const digest = createHash("sha256")
    .update(reference.trim())
    .digest("hex")
    .slice(0, 20);

  return `OLFFY_TUU_${digest}`;
}

function toAdminPhysicalOrder(
  order: {
    id: string;
    name: string;
    displayFinancialStatus: string;
    totalPriceSet: {
      shopMoney: { amount: string; currencyCode: string };
    };
  },
  reused: boolean,
): AdminPhysicalOrder {
  return {
    id: order.id,
    name: order.name,
    displayFinancialStatus: order.displayFinancialStatus,
    total: Number(order.totalPriceSet.shopMoney.amount),
    currencyCode: order.totalPriceSet.shopMoney.currencyCode,
    reused,
  };
}

function assertPhysicalOrder(
  order: AdminPhysicalOrder,
  expectedTotal: number,
): AdminPhysicalOrder {
  if (order.displayFinancialStatus !== "PAID") {
    throw new Error(
      `La orden ${order.name} existe, pero Shopify no la considera pagada.`,
    );
  }

  if (
    order.currencyCode !== "CLP" ||
    Math.abs(order.total - expectedTotal) > 0.01
  ) {
    throw new Error(
      `La orden ${order.name} no coincide con el total TUU esperado.`,
    );
  }

  return order;
}

export async function searchAdminProductVariants(
  query: string,
  limit = 25,
): Promise<AdminPosVariant[]> {
  const normalized = query.trim().replace(/["\\]/g, " ");
  const shopifyQuery = normalized
    ? `${normalized} AND status:active`
    : "status:active";
  const res = await adminFetch<{
    data: { products: { nodes: AdminPosProductSearchNode[] } };
    variables: {
      productsFirst: number;
      variantsFirst: number;
      query: string;
    };
  }>({
    query: searchProductVariantsQuery,
    variables: {
      productsFirst: Math.min(Math.max(limit, 1), 50),
      variantsFirst: 50,
      query: shopifyQuery,
    },
  });

  return res.body.data.products.nodes
    .flatMap((product) =>
      product.variants.nodes.map((variant) => ({
        ...variant,
        product: {
          id: product.id,
          title: product.title,
          status: product.status,
        },
      })),
    )
    .slice(0, Math.min(Math.max(limit, 1), 50));
}

export async function getAdminProductVariantsByIds(
  ids: string[],
): Promise<AdminPosVariant[]> {
  if (ids.length === 0) {
    return [];
  }

  const res = await adminFetch<{
    data: { nodes: Array<AdminPosVariant | null> };
    variables: { ids: string[] };
  }>({
    query: getProductVariantsByIdsQuery,
    variables: { ids },
  });

  return res.body.data.nodes.filter(
    (node): node is AdminPosVariant => node !== null,
  );
}

export async function createOrFindPaidPhysicalOrder(
  input: CreatePhysicalOrderInput,
): Promise<AdminPhysicalOrder> {
  const olffyReference =
    input.olffyReference?.trim() || input.tuuTransactionId.trim();
  const channel = input.channel ?? "physical";
  const saleChannelDetail =
    input.saleChannelDetail ??
    (channel === "online" ? "online_tuu" : "physical_tuu_manual");
  const tag = physicalOrderTag(olffyReference);
  const existing = await adminFetch<{
    data: {
      orders: {
        nodes: Array<{
          id: string;
          name: string;
          displayFinancialStatus: string;
          totalPriceSet: {
            shopMoney: { amount: string; currencyCode: string };
          };
        }>;
      };
    };
    variables: { query: string };
  }>({
    query: findPhysicalOrderQuery,
    variables: { query: `tag:${tag}` },
  });
  const existingOrder = existing.body.data.orders.nodes[0];

  if (existingOrder) {
    return assertPhysicalOrder(
      toAdminPhysicalOrder(existingOrder, true),
      input.total,
    );
  }

  const order: Record<string, unknown> = {
    currency: "CLP",
    lineItems: input.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      priceSet: {
        shopMoney: {
          amount: item.unitPrice.toFixed(2),
          currencyCode: "CLP",
        },
      },
    })),
    transactions: [
      {
        kind: "SALE",
        status: "SUCCESS",
        amountSet: {
          shopMoney: {
            amount: input.total.toFixed(2),
            currencyCode: "CLP",
          },
        },
      },
    ],
    tags: [tag, channel === "online" ? "OLFFY_ONLINE" : "OLFFY_POS", "TUU"],
    sourceIdentifier: olffyReference,
    note:
      input.notes?.trim() ||
      (channel === "online"
        ? "Venta online OLFFY pagada mediante TUU"
        : "Venta fisica OLFFY pagada mediante TUU"),
    customAttributes: [
      { key: "Medio de pago", value: "TUU" },
      { key: "Referencia OLFFY", value: olffyReference },
      { key: "Referencia TUU", value: input.tuuTransactionId.trim() },
      { key: "Canal OLFFY", value: saleChannelDetail },
      {
        key: "Comprobante TUU",
        value: input.receiptNumber?.trim() || "Sin comprobante",
      },
      { key: "Responsable", value: input.responsible.trim() },
    ],
    metafields: [
      {
        namespace: "olffy",
        key: "reference",
        type: "single_line_text_field",
        value: olffyReference,
      },
      {
        namespace: "olffy",
        key: "sale_channel_detail",
        type: "single_line_text_field",
        value: saleChannelDetail,
      },
      {
        namespace: "olffy",
        key: "tuu_transaction_id",
        type: "single_line_text_field",
        value: input.tuuTransactionId.trim(),
      },
      ...(input.metafields ?? []).map((metafield) => ({
        ...metafield,
        type: "single_line_text_field",
      })),
    ],
  };

  if (input.customer) {
    order.email = input.customer.email;

    if (input.customer.shopifyCustomerId) {
      order.customer = {
        toAssociate: { id: input.customer.shopifyCustomerId },
      };
    }
  }

  if (input.discount && input.discount.amount > 0) {
    order.discountCode = {
      itemFixedDiscountCode: {
        code: input.discount.code,
        amountSet: {
          shopMoney: {
            amount: input.discount.amount.toFixed(2),
            currencyCode: "CLP",
          },
        },
      },
    };
  }

  const created = await adminFetch<{
    data: {
      orderCreate: {
        order: {
          id: string;
          name: string;
          displayFinancialStatus: string;
          totalPriceSet: {
            shopMoney: { amount: string; currencyCode: string };
          };
        } | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    };
    variables: {
      order: Record<string, unknown>;
      options: Record<string, unknown>;
    };
  }>({
    query: createPhysicalOrderMutation,
    variables: {
      order,
      options: {
        inventoryBehaviour: "DECREMENT_OBEYING_POLICY",
        sendReceipt: false,
        sendFulfillmentReceipt: false,
      },
    },
  });
  const payload = created.body.data.orderCreate;

  if (payload.userErrors.length > 0) {
    throw new Error(
      `Shopify no pudo crear la orden: ${payload.userErrors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  if (!payload.order) {
    throw new Error("Shopify no devolvio la orden creada.");
  }

  return assertPhysicalOrder(
    toAdminPhysicalOrder(payload.order, false),
    input.total,
  );
}

export async function createOrFindPaidOlffyOrder(
  input: CreatePhysicalOrderInput,
): Promise<AdminPhysicalOrder> {
  return createOrFindPaidPhysicalOrder(input);
}

export async function updateOlffyOrderMetafields(
  orderId: string,
  metafields: Array<{ namespace: string; key: string; value: string }>,
) {
  const response = await adminFetch<{
    data: {
      orderUpdate: {
        order: { id: string } | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    };
    variables: { input: Record<string, unknown> };
  }>({
    query: updateOlffyOrderMutation,
    variables: {
      input: {
        id: normalizeShopifyGid("Order", orderId),
        metafields: metafields.map((metafield) => ({
          ...metafield,
          type: "single_line_text_field",
        })),
      },
    },
  });
  const payload = response.body.data.orderUpdate;

  if (payload.userErrors.length > 0) {
    throw new Error(
      `Shopify no pudo actualizar los metafields: ${payload.userErrors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  if (!payload.order) {
    throw new Error("Shopify no devolvio la orden actualizada");
  }

  return payload.order;
}

export async function checkAdminOrderAccess(): Promise<boolean> {
  await adminFetch<{
    data: {
      orders: {
        nodes: Array<{ id: string }>;
      };
    };
    variables: { query: string };
  }>({
    query: findPhysicalOrderQuery,
    variables: { query: "tag:OLFFY_POS" },
  });

  return true;
}

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
        title
        handle
        productsCount {
          count
        }
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
    variables: { id: normalizeShopifyGid("Product", id) },
  });
  return res.body.data.product || null;
}

export async function createAdminProduct(
  input: any,
  initialVariant?: { price?: string | number },
): Promise<any> {
  const res = await adminFetch<any>({
    query: productCreateMutation,
    variables: { product: input },
  });
  const productCreate = res.body.data.productCreate;
  const price = initialVariant?.price;
  const createdProduct = productCreate.product;
  const initialVariantId = createdProduct?.variants?.nodes?.[0]?.id;

  if (
    productCreate.userErrors?.length > 0 ||
    price === undefined ||
    price === "" ||
    !createdProduct?.id ||
    !initialVariantId
  ) {
    return productCreate;
  }

  const variantUpdate = await adminFetch<any>({
    query: productVariantsBulkUpdateMutation,
    variables: {
      productId: createdProduct.id,
      variants: [
        {
          id: initialVariantId,
          price,
        },
      ],
    },
  });
  const variantPayload = variantUpdate.body.data.productVariantsBulkUpdate;

  return {
    ...productCreate,
    userErrors: [
      ...(productCreate.userErrors ?? []),
      ...(variantPayload.userErrors ?? []),
    ],
  };
}

export async function updateAdminProduct(input: any): Promise<any> {
  const res = await adminFetch<any>({
    query: productUpdateMutation,
    variables: {
      product: {
        ...input,
        id: normalizeShopifyGid("Product", input.id),
      },
    },
  });
  return res.body.data.productUpdate;
}

export async function deleteAdminProduct(id: string): Promise<any> {
  const res = await adminFetch<any>({
    query: productDeleteMutation,
    variables: {
      input: { id: normalizeShopifyGid("Product", id) },
    },
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
    variables: { id: normalizeShopifyGid("Collection", id) },
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
    variables: {
      input: {
        ...input,
        id: normalizeShopifyGid("Collection", input.id),
      },
    },
  });
  return res.body.data.collectionUpdate;
}

export async function deleteAdminCollection(id: string): Promise<any> {
  const res = await adminFetch<any>({
    query: collectionDeleteMutation,
    variables: {
      input: { id: normalizeShopifyGid("Collection", id) },
    },
  });
  return res.body.data.collectionDelete;
}
