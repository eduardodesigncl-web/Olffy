import "server-only";

export type MarketingEvent = {
  id: string;
  eventType: string;
  idempotencyKey: string;
  email?: string;
  shopifyCustomerId?: string;
  loyaltyCustomerId?: string;
  payload: Record<string, unknown>;
};

export interface MarketingProvider {
  readonly name: string;
  send(event: MarketingEvent): Promise<void>;
}

export async function getMarketingProvider(): Promise<MarketingProvider> {
  const provider =
    process.env.MARKETING_PROVIDER?.trim().toLowerCase() || "noop";

  if (provider === "noop") {
    const { noopMarketingProvider } = await import("./providers/noop");
    return noopMarketingProvider;
  }

  if (provider === "klaviyo") {
    const { klaviyoMarketingProvider } = await import("./providers/klaviyo");
    return klaviyoMarketingProvider;
  }

  throw new Error(`Proveedor de marketing no soportado: ${provider}`);
}
