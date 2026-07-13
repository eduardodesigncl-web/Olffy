import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../shopify/admin", () => ({ adminFetch: vi.fn() }));

import { isExcludedFromPointsMetafield } from "./eligibility";

describe("Shopify product points metafield", () => {
  it("treats a missing metafield as eligible", () => {
    expect(isExcludedFromPointsMetafield(null)).toBe(false);
  });

  it("treats false as eligible", () => {
    expect(
      isExcludedFromPointsMetafield({ value: "false", jsonValue: false }),
    ).toBe(false);
  });

  it("only excludes an explicit true", () => {
    expect(
      isExcludedFromPointsMetafield({ value: "true", jsonValue: true }),
    ).toBe(true);
  });
});
