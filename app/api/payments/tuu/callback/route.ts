import { completeTuuOnlinePayment } from "lib/transactions/orchestrator";
import { getTuuOnlineConfig } from "lib/tuu/config";
import { verifyTuuSignature } from "lib/tuu/signature";
import { NextResponse } from "next/server";

type CallbackBody = {
  reference?: string;
  payment_reference?: string;
  transaction_id?: string;
  event_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CallbackBody;
    const config = getTuuOnlineConfig();
    const timestamp = request.headers.get("x-tuu-timestamp") ?? "";
    const signature = request.headers.get("x-tuu-signature") ?? "";

    if (
      !verifyTuuSignature({
        payload: body,
        secret: config.secretKey,
        timestamp,
        signature,
      })
    ) {
      return NextResponse.json(
        { error: "Firma TUU invalida" },
        { status: 401 },
      );
    }

    const status = String(body.status ?? "").toLowerCase();
    if (!["paid", "approved", "confirmed", "success"].includes(status)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const olffyReference = String(body.reference ?? "").trim();
    const paymentReference = String(
      body.payment_reference ?? body.transaction_id ?? "",
    ).trim();
    const amount = Number(body.amount);
    const currency = String(body.currency ?? "").toUpperCase();

    if (
      !olffyReference ||
      !paymentReference ||
      !Number.isInteger(amount) ||
      amount < 0 ||
      currency !== "CLP"
    ) {
      return NextResponse.json(
        { error: "Callback TUU incompleto" },
        { status: 400 },
      );
    }

    const result = await completeTuuOnlinePayment({
      olffyReference,
      paymentReference,
      providerEventId: body.event_id,
      amount,
      currency,
    });

    return NextResponse.json({ received: true, ...result });
  } catch (cause) {
    console.error("Error processing TUU callback:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo procesar el callback TUU",
      },
      { status: 400 },
    );
  }
}
