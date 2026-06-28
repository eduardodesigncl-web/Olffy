import { describe, expect, it } from "vitest";
import { noopDteProvider } from "./noop";

describe("noop DTE provider", () => {
  it("returns a deterministic simulated folio without external calls", async () => {
    const input = {
      idempotencyKey: "dte:gid://shopify/Order/123",
      olffyReference: "OLFFY-123",
      shopifyOrderId: "gid://shopify/Order/123",
      shopifyOrderName: "#1001",
      total: 19_990,
      currency: "CLP" as const,
    };
    const first = await noopDteProvider.issueBoleta(input);
    const second = await noopDteProvider.issueBoleta(input);

    expect(first.status).toBe("issued");
    expect(first.provider).toBe("noop");
    expect(first.folio).toBe(second.folio);
  });
});
