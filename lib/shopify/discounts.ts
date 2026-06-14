import "server-only";

import { adminFetch } from "./admin";
import { normalizeShopifyGid } from "./gid";

type DiscountUserError = {
  field?: string[];
  code?: string;
  message: string;
};

export type ShopifyBasicCodeDiscount = {
  nodeId: string;
  code: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  usageCount: number;
};

export class ShopifyDiscountError extends Error {
  constructor(
    message: string,
    readonly uncertainCreation = false,
  ) {
    super(message);
    this.name = "ShopifyDiscountError";
  }
}

const discountFields = /* GraphQL */ `
  fragment OlffyBasicDiscountFields on DiscountCodeBasic {
    status
    startsAt
    endsAt
    asyncUsageCount
    codes(first: 1) {
      nodes {
        code
      }
    }
  }
`;

const createBasicCodeDiscountMutation = /* GraphQL */ `
  ${discountFields}
  mutation createOlffyBasicCodeDiscount(
    $basicCodeDiscount: DiscountCodeBasicInput!
  ) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          __typename
          ...OlffyBasicDiscountFields
        }
      }
      userErrors {
        field
        code
        message
      }
    }
  }
`;

const getBasicCodeDiscountQuery = /* GraphQL */ `
  ${discountFields}
  query getOlffyBasicCodeDiscount($id: ID!) {
    codeDiscountNode(id: $id) {
      id
      codeDiscount {
        __typename
        ...OlffyBasicDiscountFields
      }
    }
  }
`;

const getBasicCodeDiscountByCodeQuery = /* GraphQL */ `
  ${discountFields}
  query getOlffyBasicCodeDiscountByCode($code: String!) {
    codeDiscountNodeByCode(code: $code) {
      id
      codeDiscount {
        __typename
        ...OlffyBasicDiscountFields
      }
    }
  }
`;

const deactivateCodeDiscountMutation = /* GraphQL */ `
  ${discountFields}
  mutation deactivateOlffyCodeDiscount($id: ID!) {
    discountCodeDeactivate(id: $id) {
      codeDiscountNode {
        id
        codeDiscount {
          __typename
          ...OlffyBasicDiscountFields
        }
      }
      userErrors {
        field
        code
        message
      }
    }
  }
`;

type BasicDiscountNode = {
  id: string;
  codeDiscount: {
    __typename?: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    asyncUsageCount: number;
    codes: { nodes: Array<{ code: string }> };
  };
};

function errorMessage(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "Error desconocido de Shopify";
}

function formatUserErrors(operation: string, errors: DiscountUserError[]) {
  return `${operation}: ${errors
    .map((error) => {
      const field = error.field?.length ? ` (${error.field.join(".")})` : "";
      return `${error.message}${field}`;
    })
    .join("; ")}`;
}

function isDefinitePreflightFailure(cause: unknown) {
  const message = errorMessage(cause).toLowerCase();

  return (
    message.includes("shpss_") ||
    message.includes("falta shopify_admin") ||
    message.includes("no pudo autenticar") ||
    message.includes("access_denied") ||
    message.includes("permisos admin api") ||
    message.includes(" 401") ||
    message.includes(" 403") ||
    message.includes("(401)") ||
    message.includes("(403)")
  );
}

function toBasicDiscount(
  node: BasicDiscountNode | null,
): ShopifyBasicCodeDiscount | null {
  if (!node || node.codeDiscount.__typename === "DiscountCodeBasic") {
    if (!node) return null;

    const code = node.codeDiscount.codes.nodes[0]?.code;
    if (!code) {
      throw new ShopifyDiscountError(
        "Shopify devolvió un descuento sin código.",
      );
    }

    return {
      nodeId: node.id,
      code,
      status: node.codeDiscount.status,
      startsAt: node.codeDiscount.startsAt,
      endsAt: node.codeDiscount.endsAt,
      usageCount: node.codeDiscount.asyncUsageCount,
    };
  }

  throw new ShopifyDiscountError(
    "El nodo de Shopify no corresponde a un descuento básico.",
  );
}

function trustedCustomerGid(value: string | null) {
  if (!value?.startsWith("gid://shopify/Customer/")) {
    return null;
  }

  try {
    return normalizeShopifyGid("Customer", value);
  } catch {
    return null;
  }
}

export async function getShopifyBasicCodeDiscount(
  id: string,
): Promise<ShopifyBasicCodeDiscount | null> {
  const response = await adminFetch<{
    data: { codeDiscountNode: BasicDiscountNode | null };
    variables: { id: string };
  }>({
    query: getBasicCodeDiscountQuery,
    variables: { id },
  });

  return toBasicDiscount(response.body.data.codeDiscountNode);
}

export async function findShopifyBasicCodeDiscountByCode(
  code: string,
): Promise<ShopifyBasicCodeDiscount | null> {
  const response = await adminFetch<{
    data: { codeDiscountNodeByCode: BasicDiscountNode | null };
    variables: { code: string };
  }>({
    query: getBasicCodeDiscountByCodeQuery,
    variables: { code },
  });

  return toBasicDiscount(response.body.data.codeDiscountNodeByCode);
}

export async function createShopifyBasicCodeDiscount(input: {
  title: string;
  code: string;
  discountAmountClp: number;
  minimumPurchaseClp: number;
  startsAt: Date;
  endsAt: Date;
  shopifyCustomerId: string | null;
}): Promise<ShopifyBasicCodeDiscount> {
  const customerGid = trustedCustomerGid(input.shopifyCustomerId);
  const basicCodeDiscount = {
    title: input.title,
    code: input.code,
    startsAt: input.startsAt.toISOString(),
    endsAt: input.endsAt.toISOString(),
    usageLimit: 1,
    appliesOncePerCustomer: true,
    context: customerGid
      ? { customers: { add: [customerGid] } }
      : { all: true },
    customerGets: {
      value: {
        discountAmount: {
          amount: input.discountAmountClp.toFixed(2),
          appliesOnEachItem: false,
        },
      },
      items: { all: true },
    },
    ...(input.minimumPurchaseClp > 0
      ? {
          minimumRequirement: {
            subtotal: {
              greaterThanOrEqualToSubtotal: input.minimumPurchaseClp.toFixed(2),
            },
          },
        }
      : {}),
  };

  try {
    const response = await adminFetch<{
      data: {
        discountCodeBasicCreate: {
          codeDiscountNode: BasicDiscountNode | null;
          userErrors: DiscountUserError[];
        };
      };
      variables: {
        basicCodeDiscount: Record<string, unknown>;
      };
    }>({
      query: createBasicCodeDiscountMutation,
      variables: { basicCodeDiscount },
    });
    const payload = response.body.data.discountCodeBasicCreate;

    if (payload.userErrors.length > 0) {
      throw new ShopifyDiscountError(
        formatUserErrors("Shopify rechazó el descuento", payload.userErrors),
      );
    }

    const discount = toBasicDiscount(payload.codeDiscountNode);
    if (!discount) {
      throw new ShopifyDiscountError(
        "Shopify no devolvió el descuento creado.",
        true,
      );
    }

    return discount;
  } catch (cause) {
    if (cause instanceof ShopifyDiscountError) {
      throw cause;
    }

    if (isDefinitePreflightFailure(cause)) {
      throw new ShopifyDiscountError(errorMessage(cause));
    }

    try {
      const existing = await findShopifyBasicCodeDiscountByCode(input.code);
      if (existing) {
        return existing;
      }

      throw new ShopifyDiscountError(errorMessage(cause));
    } catch (lookupCause) {
      if (lookupCause instanceof ShopifyDiscountError) {
        throw lookupCause;
      }

      throw new ShopifyDiscountError(
        `${errorMessage(cause)} No se pudo confirmar si Shopify creó el código.`,
        true,
      );
    }
  }
}

export async function deactivateShopifyCodeDiscount(
  id: string,
): Promise<ShopifyBasicCodeDiscount> {
  const response = await adminFetch<{
    data: {
      discountCodeDeactivate: {
        codeDiscountNode: BasicDiscountNode | null;
        userErrors: DiscountUserError[];
      };
    };
    variables: { id: string };
  }>({
    query: deactivateCodeDiscountMutation,
    variables: { id },
  });
  const payload = response.body.data.discountCodeDeactivate;

  if (payload.userErrors.length > 0) {
    throw new ShopifyDiscountError(
      formatUserErrors(
        "Shopify no pudo desactivar el descuento",
        payload.userErrors,
      ),
    );
  }

  const discount = toBasicDiscount(payload.codeDiscountNode);
  if (!discount) {
    throw new ShopifyDiscountError(
      "Shopify no devolvió el descuento desactivado.",
    );
  }

  return discount;
}
