import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function providerWithFetch() {
  vi.stubEnv("KLAVIYO_PRIVATE_API_KEY", "test-private-key");
  vi.stubEnv("KLAVIYO_LIST_ID", "test-list");
  vi.stubEnv("KLAVIYO_REVISION", "2026-04-15");
  const fetchMock = vi.fn(
    async (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input);
      return new Response(null, {
        status: url.endsWith("profile-import") ? 200 : 202,
      });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  const { klaviyoMarketingProvider } = await import("./klaviyo");
  return { provider: klaviyoMarketingProvider, fetchMock };
}

describe("klaviyoMarketingProvider", () => {
  it("crea perfil, suscribe con consentimiento explícito y registra el evento", async () => {
    const { provider, fetchMock } = await providerWithFetch();

    await provider.send({
      id: "event-1",
      eventType: "Newsletter Signup",
      idempotencyKey: "marketing:newsletter:test@example.com",
      email: "test@example.com",
      payload: { source: "storefront_footer" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("profile-import");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "profile-subscription-bulk-create-jobs",
    );
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/events");
    const eventBody = JSON.parse(
      String((fetchMock.mock.calls[2]?.[1] as RequestInit).body),
    );
    expect(eventBody.data.attributes.unique_id).toBe(
      "marketing:newsletter:test@example.com",
    );
  });

  it("no modifica la suscripción con eventos operativos", async () => {
    const { provider, fetchMock } = await providerWithFetch();

    await provider.send({
      id: "event-2",
      eventType: "Points Earned",
      idempotencyKey: "marketing:Points Earned:2",
      email: "test@example.com",
      loyaltyCustomerId: "2",
      payload: { points_earned: 100 },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("profile-subscription-bulk-create-jobs"),
      ),
    ).toBe(false);
  });
});
