import type { MarketingProvider } from "../provider";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} no esta configurado`);
  return value;
}

const revision = process.env.KLAVIYO_REVISION?.trim() || "2026-04-15";

function klaviyoHeaders() {
  return {
    accept: "application/vnd.api+json",
    "content-type": "application/vnd.api+json",
    Authorization: `Klaviyo-API-Key ${required("KLAVIYO_PRIVATE_API_KEY")}`,
    revision,
  };
}

async function subscribeProfile(email: string) {
  const listId = required("KLAVIYO_LIST_ID");
  const response = await fetch(
    "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs",
    {
      method: "POST",
      headers: klaviyoHeaders(),
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            custom_source: "OLFFY loyalty and storefront consent",
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email,
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              ],
            },
          },
          relationships: {
            list: {
              data: {
                type: "list",
                id: listId,
              },
            },
          },
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Klaviyo rechazo la suscripcion (${response.status}): ${await response.text()}`,
    );
  }
}

export const klaviyoMarketingProvider: MarketingProvider = {
  name: "klaviyo",
  async send(event) {
    if (!event.email) {
      return;
    }

    await subscribeProfile(event.email);

    const response = await fetch("https://a.klaviyo.com/api/events", {
      method: "POST",
      headers: klaviyoHeaders(),
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            unique_id: event.idempotencyKey,
            metric: {
              data: {
                type: "metric",
                attributes: { name: `OLFFY - ${event.eventType}` },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: { email: event.email },
              },
            },
            properties: event.payload,
            time: new Date().toISOString(),
          },
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Klaviyo rechazo el evento (${response.status}): ${await response.text()}`,
      );
    }
  },
};
