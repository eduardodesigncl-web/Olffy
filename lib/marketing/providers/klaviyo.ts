import type { MarketingProvider } from "../provider";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} no esta configurado`);
  return value;
}

const revision = process.env.KLAVIYO_REVISION?.trim() || "2026-04-15";
const KLAVIYO_API_URL = "https://a.klaviyo.com/api";

function klaviyoHeaders() {
  return {
    accept: "application/vnd.api+json",
    "content-type": "application/vnd.api+json",
    Authorization: `Klaviyo-API-Key ${required("KLAVIYO_PRIVATE_API_KEY")}`,
    revision,
  };
}

function profileProperties(event: Parameters<MarketingProvider["send"]>[0]) {
  const payloadProperties = Object.fromEntries(
    Object.entries(event.payload)
      .filter(([, value]) =>
        ["string", "number", "boolean"].includes(typeof value),
      )
      .slice(0, 30)
      .map(([key, value]) => [`olffy_${key}`, value]),
  );

  return {
    olffy_source: "OLFFY",
    ...(event.shopifyCustomerId
      ? { shopify_customer_id: event.shopifyCustomerId }
      : {}),
    ...(event.loyaltyCustomerId
      ? { loyalty_customer_id: event.loyaltyCustomerId }
      : {}),
    last_olffy_event: event.eventType,
    ...payloadProperties,
  };
}

async function klaviyoRequest(path: string, init: RequestInit) {
  let lastError = "Klaviyo no respondió";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${KLAVIYO_API_URL}/${path}`, {
      ...init,
      headers: { ...klaviyoHeaders(), ...init.headers },
      cache: "no-store",
    });

    if (response.ok) return response;

    const body = (await response.text()).slice(0, 1200);
    lastError =
      response.status === 429
        ? "Klaviyo limitó temporalmente el envío; la cola lo reintentará."
        : `Klaviyo respondió ${response.status}: ${body}`;
    if (response.status !== 429 && response.status < 500) break;

    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    const waitMs = Math.max(retryAfter * 1000, 300 * 2 ** attempt);

    // No se reintenta antes de que venza Retry-After. Si Klaviyo solicita una
    // espera larga, se devuelve el evento a la cola para el siguiente ciclo.
    if (attempt === 2 || waitMs > 5000) break;

    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw new Error(lastError);
}

async function upsertProfile(event: Parameters<MarketingProvider["send"]>[0]) {
  await klaviyoRequest("profile-import", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "profile",
        attributes: {
          email: event.email,
          locale: "es-CL",
          properties: profileProperties(event),
        },
      },
    }),
  });
}

async function subscribeProfile(email: string) {
  const listId = required("KLAVIYO_LIST_ID");
  await klaviyoRequest("profile-subscription-bulk-create-jobs", {
    method: "POST",
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
  });
}

export const klaviyoMarketingProvider: MarketingProvider = {
  name: "klaviyo",
  async send(event) {
    if (!event.email) {
      return;
    }

    await upsertProfile(event);

    // Sólo una acción explícita de consentimiento puede suscribir o quitar
    // supresiones. Los eventos de compra/fidelización nunca resuscriben a una
    // persona que se haya dado de baja directamente en Klaviyo.
    if (event.eventType === "Newsletter Signup") {
      await subscribeProfile(event.email);
    }

    await klaviyoRequest("events", {
      method: "POST",
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
                attributes: {
                  email: event.email,
                  properties: profileProperties(event),
                },
              },
            },
            properties: event.payload,
            time: new Date().toISOString(),
          },
        },
      }),
    });
  },
};
