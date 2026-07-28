import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  claimPhysicalSalePosAttempt,
  failPhysicalSalePosAttempt,
  type PhysicalSalePosBenefit,
} from "lib/loyalty/service";
import {
  finalizePreparedPhysicalSale,
  physicalSaleErrorMessage,
  preparePhysicalSale,
  requiredPhysicalSaleText,
} from "lib/loyalty/physical-pos";
import { checkAdminOrderAccess } from "lib/shopify/admin";
import { NextResponse } from "next/server";

type SaleRequest = {
  paymentConfirmed?: boolean;
  customerId?: number | null;
  items?: Array<{ variantId?: string; quantity?: number }>;
  benefitType?: PhysicalSalePosBenefit;
  pointsToUse?: number;
  benefitAmount?: number;
  discountCode?: string;
  manualDiscountReason?: string;
  paymentReference?: string;
  /** Compatibilidad con clientes anteriores del POS. */
  tuuTransactionId?: string;
  receiptNumber?: string;
  responsible?: string;
  notes?: string;
};

export async function GET() {
  const unauthorized = await getAdminApiUnauthorizedResponse("pos");
  if (unauthorized) return unauthorized;

  try {
    await checkAdminOrderAccess();

    return NextResponse.json({ ordersAccess: true });
  } catch (error) {
    console.error("Error checking Shopify order access:", error);
    return NextResponse.json(
      { ordersAccess: false, error: physicalSaleErrorMessage(error) },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("pos");
  if (unauthorized) return unauthorized;

  let attempt:
    | Awaited<ReturnType<typeof claimPhysicalSalePosAttempt>>
    | undefined;

  try {
    const body = (await request.json()) as SaleRequest;
    const paymentReference = requiredPhysicalSaleText(
      body.paymentReference ?? body.tuuTransactionId,
      "la referencia del pago",
    );
    const responsible = requiredPhysicalSaleText(
      body.responsible,
      "el responsable",
    );

    if (body.paymentConfirmed !== true) {
      throw new Error("Debes confirmar que el pago fue recibido");
    }

    const prepared = await preparePhysicalSale(body);
    attempt = await claimPhysicalSalePosAttempt({
      tuuTransactionId: paymentReference,
      payloadFingerprint: prepared.fingerprint,
      createdBy: responsible,
    });

    if (attempt.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        status: "completed",
        paymentReference,
        folio: attempt.physicalSaleId
          ? `#${attempt.physicalSaleId}`
          : undefined,
        physicalSaleId: attempt.physicalSaleId,
        shopifyOrderId: attempt.shopifyOrderId,
        shopifyOrderName: attempt.shopifyOrderName,
        subtotal: prepared.subtotal,
        discount: prepared.discount,
        total: prepared.total,
        pointsEarned: prepared.pointsEarned,
        pointsSpent: prepared.pointsSpent,
      });
    }

    if (!attempt.claimToken) {
      throw new Error("No se pudo obtener el control del intento de venta");
    }

    const result = await finalizePreparedPhysicalSale({
      prepared,
      attempt: {
        attemptId: attempt.attemptId,
        claimToken: attempt.claimToken,
      },
      paymentReference,
      receiptNumber: body.receiptNumber,
      responsible,
      notes: body.notes,
      saleChannelDetail: "physical_tuu_manual",
    });

    return NextResponse.json({
      success: true,
      alreadyCompleted: result.alreadyCompleted,
      status: "completed",
      paymentReference,
      folio: `#${result.physicalSaleId}`,
      physicalSaleId: result.physicalSaleId,
      shopifyOrderId: result.shopifyOrderId,
      shopifyOrderName: result.shopifyOrderName,
      subtotal: prepared.subtotal,
      discount: prepared.discount,
      total: prepared.total,
      pointsEarned: prepared.pointsEarned,
      pointsSpent: prepared.pointsSpent,
      transactionPipelineWarning: result.transactionPipelineWarning,
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

    console.error("Error completing manual POS sale:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
