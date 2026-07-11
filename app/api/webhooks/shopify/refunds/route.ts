import { verifyShopifyWebhookHmac } from "lib/admin/digital-sales";
import { processShopifyRefundEvent } from "lib/loyalty/reversals";
import { NextResponse } from "next/server";

function toGid(resource: "Order", value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("gid://shopify/")) {
    return value;
  }
  const text = String(value ?? "").trim();
  return /^\d+$/.test(text) ? `gid://shopify/${resource}/${text}` : null;
}

function toAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(Math.round(amount), 0) : 0;
}

// Suma reembolsada de un payload refunds/create: transacciones de tipo refund
// exitosas; si no vienen, cae a los subtotales de las líneas devueltas.
function refundedAmountFromPayload(payload: Record<string, unknown>): number {
  const transactions = Array.isArray(payload.transactions)
    ? (payload.transactions as Array<Record<string, unknown>>)
    : [];
  const fromTransactions = transactions
    .filter(
      (transaction) =>
        String(transaction.kind ?? "").toLowerCase() === "refund" &&
        ["success", "pending", ""].includes(
          String(transaction.status ?? "").toLowerCase(),
        ),
    )
    .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0);

  if (fromTransactions > 0) return fromTransactions;

  const lineItems = Array.isArray(payload.refund_line_items)
    ? (payload.refund_line_items as Array<Record<string, unknown>>)
    : [];

  return lineItems.reduce((sum, line) => sum + toAmount(line.subtotal), 0);
}

// Webhook de devoluciones/anulaciones Shopify (S5-04). Registrar en Shopify
// los topics `refunds/create` y `orders/cancelled` apuntando a esta ruta.
// Idempotente: un webhook repetido no duplica la reversa.
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !verifyShopifyWebhookHmac({
      rawBody,
      hmacHeader: request.headers.get("x-shopify-hmac-sha256"),
    })
  ) {
    return NextResponse.json(
      { error: "Firma Shopify invalida" },
      { status: 401 },
    );
  }

  const topic = (request.headers.get("x-shopify-topic") ?? "").toLowerCase();

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    if (topic === "orders/cancelled") {
      const orderGid = toGid(
        "Order",
        payload.admin_graphql_api_id ?? payload.id,
      );

      if (!orderGid) {
        throw new Error("El webhook no incluye identificador de orden");
      }

      const result = await processShopifyRefundEvent({
        orderGid,
        refundId: "cancelled",
        refundedAmount: 0,
        fullCancellation: true,
        reason: String(payload.cancel_reason ?? "orden anulada"),
      });

      return NextResponse.json({ received: true, topic, ...result });
    }

    // refunds/create (default): payload de refund con order_id.
    const orderGid = toGid("Order", payload.order_id);
    const refundId = String(payload.id ?? "").trim();

    if (!orderGid || !refundId) {
      throw new Error("El webhook de refund no incluye orden o refund id");
    }

    const result = await processShopifyRefundEvent({
      orderGid,
      refundId,
      refundedAmount: refundedAmountFromPayload(payload),
      fullCancellation: false,
      reason: String(payload.note ?? "") || undefined,
    });

    return NextResponse.json({ received: true, topic, ...result });
  } catch (cause) {
    const message =
      cause instanceof Error
        ? cause.message
        : "No se pudo procesar la devolución";

    console.error("Error processing Shopify refund webhook:", cause);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
