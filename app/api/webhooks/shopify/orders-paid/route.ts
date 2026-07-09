import { processShopifyOrdersPaidWebhook } from "lib/admin/digital-sales";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const result = await processShopifyOrdersPaidWebhook({
      rawBody,
      hmacHeader: request.headers.get("x-shopify-hmac-sha256"),
      webhookId: request.headers.get("x-shopify-webhook-id"),
    });

    return NextResponse.json({ received: true, ...result });
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudo procesar el webhook Shopify";

    console.error("Error processing Shopify orders/paid webhook:", cause);

    return NextResponse.json(
      { error: message },
      { status: message.includes("Firma Shopify") ? 401 : 400 },
    );
  }
}
