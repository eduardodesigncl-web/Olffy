import { describe, expect, it } from "vitest";

import { safeCustomerReturnUrl } from "./return-url";

describe("safeCustomerReturnUrl", () => {
  it("preserves an internal cart return URL", () => {
    expect(safeCustomerReturnUrl("/tienda?cart=open#puntos")).toBe(
      "/tienda?cart=open#puntos",
    );
  });

  it.each([
    "https://example.com/tienda",
    "//example.com/tienda",
    "javascript:alert(1)",
    "tienda",
  ])("rejects unsafe return URL %s", (value) => {
    expect(safeCustomerReturnUrl(value)).toBe("/cuenta");
  });

  it("uses the requested fallback when the value is missing", () => {
    expect(safeCustomerReturnUrl(undefined, "/tienda")).toBe("/tienda");
  });
});
