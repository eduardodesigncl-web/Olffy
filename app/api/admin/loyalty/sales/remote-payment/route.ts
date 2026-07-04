import { randomUUID } from "node:crypto";
import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  claimPhysicalSalePosAttempt,
  failPhysicalSalePosAttempt,
  getRemotePhysicalSalePosAttempt,
  saveRemotePhysicalSalePosAttempt,
  updateRemotePhysicalSalePosAttempt,
  type PhysicalSalePosBenefit,
} from "lib/loyalty/service";
import {
  physicalSaleErrorMessage,
  preparePhysicalSale,
  requiredPhysicalSaleText,
} from "lib/loyalty/physical-pos";
import { createTuuRemotePayment } from "lib/tuu/remote-payment";
import { NextResponse } from "next/server";

type RemoteSaleRequest = {
  customerId?: number | null;
  items?: Array<{ variantId?: string; quantity?: number }>;
  benefitType?: PhysicalSalePosBenefit;
  pointsToUse?: number;
  benefitAmount?: number;
  discountCode?: string;
  manualDiscountReason?: string;
  responsible?: string;
  notes?: string;
};

export async function GET(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const reference = requiredPhysicalSaleText(
      searchParams.get("reference"),
      "la referencia del cobro TUU",
    );
    const attempt = await getRemotePhysicalSalePosAttempt(reference);

    if (!attempt) {
      return NextResponse.json(
        { error: "No se encontro el cobro remoto TUU" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      reference,
      status: attempt.status,
      remotePaymentStatus: attempt.remotePaymentStatus,
      physicalSaleId: attempt.physicalSaleId,
      shopifyOrderId: attempt.shopifyOrderId,
      shopifyOrderName: attempt.shopifyOrderName,
      lastError: attempt.lastError,
    });
  } catch (error) {
    return NextResponse.json(
      { error: physicalSaleErrorMessage(error) },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  let attempt:
    | Awaited<ReturnType<typeof claimPhysicalSalePosAttempt>>
    | undefined;

  try {
    const body = (await request.json()) as RemoteSaleRequest;
    const responsible = requiredPhysicalSaleText(
      body.responsible,
      "el responsable",
    );
    const prepared = await preparePhysicalSale(body);
    const paymentReference = randomUUID();

    attempt = await claimPhysicalSalePosAttempt({
      tuuTransactionId: paymentReference,
      payloadFingerprint: prepared.fingerprint,
      createdBy: responsible,
    });

    if (attempt.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        paymentReference,
        physicalSaleId: attempt.physicalSaleId,
        shopifyOrderId: attempt.shopifyOrderId,
        shopifyOrderName: attempt.shopifyOrderName,
      });
    }

    if (!attempt.claimToken) {
      throw new Error("No se pudo obtener el control del intento de venta");
    }

    await saveRemotePhysicalSalePosAttempt({
      attemptId: attempt.attemptId,
      claimToken: attempt.claimToken,
      olffyReference: paymentReference,
      expectedTotal: prepared.total,
      payloadSnapshot: {
        prepared,
        responsible,
        notes: body.notes ?? "",
      },
      remotePaymentStatus: "created",
    });

    const providerResponse = await createTuuRemotePayment({
      idempotencyKey: paymentReference,
      amount: Math.round(prepared.total),
      currency: "CLP",
      description: `Venta OLFFY ${paymentReference}`,
      dteType: 48,
      extraData: {
        olffyReference: paymentReference,
        source: "olffy_admin_pos",
      },
    });

    await updateRemotePhysicalSalePosAttempt({
      attemptId: attempt.attemptId,
      remotePaymentStatus: "sent",
      remotePaymentResponse: providerResponse,
      providerTransactionId:
        typeof providerResponse.id === "string"
          ? providerResponse.id
          : typeof providerResponse.transactionId === "string"
            ? providerResponse.transactionId
            : undefined,
    });

    return NextResponse.json({
      success: true,
      paymentReference,
      status: "sent",
      total: prepared.total,
      provider: providerResponse,
    });
  } catch (error) {
    const message = physicalSaleErrorMessage(error);

    if (attempt?.claimToken && attempt.status === "pending") {
      await failPhysicalSalePosAttempt({
        attemptId: attempt.attemptId,
        claimToken: attempt.claimToken,
        error: message,
      });
    }

    console.error("Error sending TUU remote POS payment:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
