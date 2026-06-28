import { describe, expect, it } from "vitest";
import { normalizeShopifyGid } from "./gid";

describe("normalizeShopifyGid", () => {
  it("normalizes order identifiers used by DTE metafield updates", () => {
    expect(normalizeShopifyGid("Order", "123")).toBe("gid://shopify/Order/123");
    expect(normalizeShopifyGid("Order", "gid://shopify/Order/123")).toBe(
      "gid://shopify/Order/123",
    );
  });
});
