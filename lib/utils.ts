import { ReadonlyURLSearchParams } from "next/navigation";

export const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

export const validateEnvironmentVariables = () => {
  const missingEnvironmentVariables = [] as string[];
  const olffyShopifyStoreDomain = "olffy.cl";
  const shopifyStoreDomain =
    process.env.SHOPIFY_s_SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    olffyShopifyStoreDomain;
  const shopifyStorefrontAccessToken =
    process.env.SHOPIFY_s_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!shopifyStoreDomain) {
    missingEnvironmentVariables.push(
      "SHOPIFY_STORE_DOMAIN or SHOPIFY_s_SHOPIFY_STORE_DOMAIN",
    );
  }

  if (!shopifyStorefrontAccessToken) {
    missingEnvironmentVariables.push(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN or SHOPIFY_s_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    );
  }

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. Read more: https://vercel.com/docs/integrations/shopify#configure-environment-variables\n\n${missingEnvironmentVariables.join(
        "\n",
      )}\n`,
    );
  }

  if (shopifyStoreDomain?.includes("[") || shopifyStoreDomain?.includes("]")) {
    throw new Error(
      "Your Shopify store domain environment variable includes brackets (ie. `[` and / or `]`). Your site will not work with them there. Please remove them.",
    );
  }
};
