import type { MarketingProvider } from "../provider";

export const noopMarketingProvider: MarketingProvider = {
  name: "noop",
  async send() {},
};
