import { describe, expect, it } from "vitest";
import { validateEnvironment } from "./validate-environment.mjs";

const safe = {
  NEXT_PUBLIC_SITE_URL: "https://staging.olffy.cl",
  ADMIN_PASSWORD: "a-long-administrator-password",
  ADMIN_SESSION_SECRET: "a-session-secret-with-at-least-32-characters",
  NEXT_PUBLIC_SUPABASE_URL: "https://staging-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-test-value",
  SUPABASE_SECRET_KEY: "server-test-value",
  SHOPIFY_STORE_DOMAIN: "staging-shop.myshopify.com",
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: "storefront-test-value",
  SHOPIFY_ADMIN_STORE_DOMAIN: "staging-shop.myshopify.com",
  SHOPIFY_ADMIN_API_ACCESS_TOKEN: "admin-test-value",
  CRON_SECRET: "cron-test-value",
  PAYMENTS_TUU_ENABLED: "false",
  TUU_REMOTE_POS_ENABLED: "false",
  DTE_PROVIDER: "noop",
  MARKETING_PROVIDER: "noop",
};

describe("delivery environment contract", () => {
  it("accepts a complete safe staging environment", () => {
    expect(validateEnvironment("staging", safe)).toEqual([]);
  });

  it("rejects partial Supabase configuration in Preview", () => {
    expect(
      validateEnvironment("preview", {
        ...safe,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        SUPABASE_SECRET_KEY: "",
      }),
    ).toContain("Supabase Preview está configurado parcialmente");
  });

  it("keeps external side effects disabled throughout Gate A", () => {
    expect(
      validateEnvironment("production", {
        ...safe,
        PAYMENTS_TUU_ENABLED: "true",
      }),
    ).toContain("PAYMENTS_TUU_ENABLED debe ser false durante Gate A");
  });

  it("reports variable names without returning their values", () => {
    const errors = validateEnvironment("staging", {
      ...safe,
      ADMIN_SESSION_SECRET: "short-secret-value",
    });
    expect(errors.join(" ")).not.toContain("short-secret-value");
  });
});
