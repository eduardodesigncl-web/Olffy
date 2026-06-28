import "server-only";

import { getTuuOnlineConfig } from "./config";
import { createTuuSignature } from "./signature";

export type TuuOnlineIntent = {
  paymentReference: string;
  providerEventId?: string;
  paymentUrl: string;
  status: string;
  raw: Record<string, unknown>;
};

export async function createTuuOnlineIntent(input: {
  olffyReference: string;
  amount: number;
  currency: "CLP";
  customerEmail?: string;
  description: string;
}): Promise<TuuOnlineIntent> {
  const config = getTuuOnlineConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = {
    account_id: config.accountId,
    amount: input.amount,
    currency: input.currency,
    reference: input.olffyReference,
    description: input.description,
    customer_email: input.customerEmail,
    callback_url: config.callbackUrl,
    complete_url: config.completeUrl,
    cancel_url: config.cancelUrl,
  };
  const response = await fetch(`${config.apiUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `tuu_online:${input.olffyReference}`,
      "X-TUU-Timestamp": timestamp,
      "X-TUU-Signature": createTuuSignature({
        payload,
        secret: config.secretKey,
        timestamp,
      }),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `TUU rechazo la creacion del pago (${response.status}): ${String(body.message ?? body.error ?? "error desconocido")}`,
    );
  }

  const paymentReference = String(
    body.payment_reference ?? body.id ?? "",
  ).trim();
  const paymentUrl = String(
    body.payment_url ?? body.redirect_url ?? body.url ?? "",
  ).trim();

  if (!paymentReference || !paymentUrl) {
    throw new Error("TUU no devolvio referencia y URL de pago");
  }

  return {
    paymentReference,
    providerEventId: body.event_id ? String(body.event_id) : undefined,
    paymentUrl,
    status: String(body.status ?? "pending"),
    raw: body,
  };
}
