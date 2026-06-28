import type { DteProvider } from "../provider";

export const noopDteProvider: DteProvider = {
  name: "noop",
  async issueBoleta(input) {
    return {
      status: "issued",
      provider: "noop",
      folio: `NOOP-${input.shopifyOrderId.replace(/\D/g, "").slice(-12) || input.olffyReference.slice(-12)}`,
      issuedAt: new Date().toISOString(),
      raw: { simulated: true },
    };
  },
};
