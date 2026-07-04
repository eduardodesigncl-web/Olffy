import { timingSafeEqual } from "node:crypto";
import {
  claimPhysicalSalePosAttempt,
  failPhysicalSalePosAttempt,
  getRemotePhysicalSalePosAttempt,
  updateRemotePhysicalSalePosAttempt,
} from "lib/loyalty/service";
import {
  finalizePreparedPhysicalSale,
  physicalSaleErrorMessage,
  type PreparedPhysicalSale,
} from "lib/loyalty/physical-pos";
import { getTuuRemotePosConfig } from "lib/tuu/config";
import { NextResponse } from "next/server";

type TuuPosStatus = "paid" | "failed" | "cancelled" | "expired" | "pending";

type NormalizedTuuPosWebhook = {
  reference: string;
  status: TuuPosStatus;
  amount?: number;
  providerTransactionId?: string;
  providerEventId?: string;
  receiptNumber?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function pickNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === "number" ? value : Number(value);

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return undefined;
}

function normalizeStatus(rawStatus: string | undefined): TuuPosStatus {
  const status = rawStatus?.trim().toLowerCase();

  if (
    status &&
    [
      "paid",
      "approved",
      "success",
      "succeeded",
      "completed",
      "confirmed",
      "aprobado",
      "aprobada",
    ].includes(status)
  ) {
    return "paid";
  }

  if (
    status &&
    [
      "failed",
      "rejected",
      "declined",
      "error",
      "rechazado",
      "rechazada",
    ].includes(status)
  ) {
    return "failed";
  }

  if (
    status &&
    ["cancelled", "canceled", "cancelado", "cancelada", "voided"].includes(
      status,
    )
  ) {
    return "cancelled";
  }

  if (
    status &&
    ["expired", "expirado", "expirada", "timeout"].includes(status)
  ) {
    return "expired";
  }

  return "pending";
}

function flattenTuuPayload(body: Record<string, unknown>) {
  const data = asRecord(body.data ?? body.Data);
  const payment = asRecord(body.payment ?? body.Payment);
  const transaction = asRecord(body.transaction ?? body.Transaction);
  const extraData = asRecord(
    body.extraData ?? body.ExtraData ?? data.extraData ?? data.ExtraData,
  );

  return {
    ...body,
    ...data,
    ...payment,
    ...transaction,
    ...extraData,
  };
}

function normalizeWebhook(
  body: Record<string, unknown>,
): NormalizedTuuPosWebhook {
  const source = flattenTuuPayload(body);
  const reference = pickString(source, [
    "olffyReference",
    "reference",
    "Reference",
    "IdempotencyKey",
    "idempotencyKey",
    "idempotency_key",
    "externalReference",
    "external_reference",
  ]);

  if (!reference) {
    throw new Error("El webhook TUU no incluye referencia de idempotencia");
  }

  const rawStatus = pickString(source, [
    "status",
    "Status",
    "state",
    "State",
    "paymentStatus",
    "payment_status",
    "transactionStatus",
    "transaction_status",
    "result",
    "Result",
  ]);

  return {
    reference,
    status: normalizeStatus(rawStatus),
    amount: pickNumber(source, ["Amount", "amount", "total", "Total", "monto"]),
    providerTransactionId: pickString(source, [
      "transactionId",
      "TransactionId",
      "transaction_id",
      "paymentId",
      "PaymentId",
      "id",
      "Id",
    ]),
    providerEventId: pickString(source, [
      "eventId",
      "EventId",
      "event_id",
      "requestId",
      "RequestId",
      "request_id",
    ]),
    receiptNumber: pickString(source, [
      "receiptNumber",
      "ReceiptNumber",
      "voucher",
      "Voucher",
      "authorizationCode",
      "AuthorizationCode",
    ]),
  };
}

function assertWebhookSecret(request: Request) {
  const { webhookSecret } = getTuuRemotePosConfig();

  if (!webhookSecret) return;

  const authorization = request.headers.get("authorization") ?? "";
  const provided =
    request.headers.get("x-tuu-webhook-secret") ||
    request.headers.get("x-haulmer-webhook-secret") ||
    request.headers.get("x-api-key") ||
    authorization.replace(/^Bearer\s+/i, "");

  if (!provided) {
    throw new Error("Webhook TUU sin secreto de autenticacion");
  }

  const expectedBuffer = Buffer.from(webhookSecret);
  const providedBuffer = Buffer.from(provided);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Webhook TUU con secreto invalido");
  }
}

function preparedFromSnapshot(snapshot: Record<string, unknown>) {
  const prepared = asRecord(
    snapshot.prepared,
  ) as unknown as PreparedPhysicalSale;

  if (
    !prepared ||
    !Array.isArray(prepared.items) ||
    prepared.items.length === 0 ||
    !Number.isFinite(Number(prepared.total))
  ) {
    throw new Error("El intento remoto TUU no tiene snapshot de venta valido");
  }

  return prepared;
}

export async function POST(request: Request) {
  try {
    assertWebhookSecret(request);

    const body = (await request.json()) as Record<string, unknown>;
    const event = normalizeWebhook(body);
    const attempt = await getRemotePhysicalSalePosAttempt(event.reference);

    if (!attempt) {
      return NextResponse.json(
        { error: "No se encontro el intento de cobro TUU" },
        { status: 404 },
      );
    }

    await updateRemotePhysicalSalePosAttempt({
      attemptId: attempt.attemptId,
      remotePaymentStatus: event.status === "pending" ? "sent" : event.status,
      receivedTotal: event.amount,
      providerTransactionId: event.providerTransactionId,
      providerEventId: event.providerEventId,
      remotePaymentResponse: body,
    });

    if (attempt.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        physicalSaleId: attempt.physicalSaleId,
      });
    }

    if (event.status !== "paid") {
      if (
        attempt.claimToken &&
        ["failed", "cancelled", "expired"].includes(event.status)
      ) {
        await failPhysicalSalePosAttempt({
          attemptId: attempt.attemptId,
          claimToken: attempt.claimToken,
          error: `TUU informo estado ${event.status}`,
        });
      }

      return NextResponse.json({ success: true, ignored: event.status });
    }

    if (
      event.amount !== undefined &&
      attempt.expectedTotal !== undefined &&
      Math.round(event.amount) !== Math.round(attempt.expectedTotal)
    ) {
      const error = `Monto TUU ${event.amount} no coincide con total esperado ${attempt.expectedTotal}`;
      await updateRemotePhysicalSalePosAttempt({
        attemptId: attempt.attemptId,
        remotePaymentStatus: "reconciliation_required",
        error,
      });
      throw new Error(error);
    }

    if (!attempt.paymentPayloadSnapshot) {
      throw new Error("El intento remoto TUU no tiene snapshot de carrito");
    }

    const prepared = preparedFromSnapshot(attempt.paymentPayloadSnapshot);
    const responsible =
      typeof attempt.paymentPayloadSnapshot.responsible === "string"
        ? attempt.paymentPayloadSnapshot.responsible
        : attempt.createdBy || "TUU webhook";
    const notes =
      typeof attempt.paymentPayloadSnapshot.notes === "string"
        ? attempt.paymentPayloadSnapshot.notes
        : undefined;
    const ownedAttempt =
      attempt.status === "pending" && attempt.claimToken
        ? {
            attemptId: attempt.attemptId,
            claimToken: attempt.claimToken,
          }
        : await claimPhysicalSalePosAttempt({
            tuuTransactionId: attempt.tuuTransactionId,
            payloadFingerprint: attempt.payloadFingerprint,
            createdBy: responsible,
          });

    if (!ownedAttempt.claimToken) {
      throw new Error("No se pudo tomar el intento remoto TUU");
    }

    const result = await finalizePreparedPhysicalSale({
      prepared,
      attempt: {
        attemptId: ownedAttempt.attemptId,
        claimToken: ownedAttempt.claimToken,
      },
      paymentReference: attempt.tuuTransactionId,
      olffyReference: attempt.olffyReference,
      receiptNumber: event.receiptNumber,
      responsible,
      notes,
      saleChannelDetail: "physical_tuu_remote",
      providerTransactionId: event.providerTransactionId,
      providerPayload: body,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = physicalSaleErrorMessage(error);

    console.error("Error processing TUU POS webhook:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
