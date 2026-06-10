import { createHash } from "node:crypto";
import { requireAdminSession } from "lib/admin/auth";
import {
  calculatePointsForAmount,
  claimPhysicalSalePosAttempt,
  failPhysicalSalePosAttempt,
  finalizePhysicalSalePos,
  getActiveLoyaltyRule,
  getLoyaltyCustomer,
  type PhysicalSalePosBenefit,
} from "lib/loyalty/service";
import {
  checkAdminOrderAccess,
  createOrFindPaidPhysicalOrder,
  getAdminProductVariantsByIds,
} from "lib/shopify/admin";
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
  tuuTransactionId?: string;
  receiptNumber?: string;
  responsible?: string;
  notes?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la venta TUU";
}

function requiredText(value: unknown, label: string): string {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`Falta ${label}`);
  }

  return normalized;
}

function positiveAmount(value: unknown, label: string): number {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} debe ser mayor que cero`);
  }

  return amount;
}

export async function GET() {
  try {
    await requireAdminSession();
    await checkAdminOrderAccess();

    return NextResponse.json({ ordersAccess: true });
  } catch (error) {
    console.error("Error checking Shopify order access:", error);
    return NextResponse.json(
      { ordersAccess: false, error: errorMessage(error) },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  let attempt:
    | Awaited<ReturnType<typeof claimPhysicalSalePosAttempt>>
    | undefined;

  try {
    await requireAdminSession();
    const body = (await request.json()) as SaleRequest;
    const tuuTransactionId = requiredText(
      body.tuuTransactionId,
      "la referencia TUU",
    );
    const responsible = requiredText(body.responsible, "el responsable");
    const benefitType = body.benefitType ?? "none";
    const requestedItems = body.items ?? [];

    if (body.paymentConfirmed !== true) {
      throw new Error("Debes confirmar que el pago TUU fue recibido");
    }

    if (
      !["none", "points", "discount_code", "manual_discount"].includes(
        benefitType,
      )
    ) {
      throw new Error("El beneficio seleccionado no es valido");
    }

    if (requestedItems.length === 0) {
      throw new Error("Agrega al menos un producto al carrito");
    }

    const quantityByVariant = new Map<string, number>();

    for (const item of requestedItems) {
      const variantId = requiredText(item.variantId, "la variante Shopify");
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        throw new Error("Las cantidades deben ser enteros entre 1 y 100");
      }

      quantityByVariant.set(
        variantId,
        (quantityByVariant.get(variantId) ?? 0) + quantity,
      );
    }

    const variantIds = [...quantityByVariant.keys()].sort();
    const variants = await getAdminProductVariantsByIds(variantIds);
    const variantById = new Map(
      variants.map((variant) => [variant.id, variant]),
    );

    if (variants.length !== variantIds.length) {
      throw new Error(
        "Uno o mas productos ya no existen en Shopify. Actualiza el carrito.",
      );
    }

    const items = variantIds.map((variantId) => {
      const variant = variantById.get(variantId);
      const quantity = quantityByVariant.get(variantId) ?? 0;

      if (!variant || variant.product.status !== "ACTIVE") {
        throw new Error("Uno de los productos ya no esta activo en Shopify");
      }

      if (variant.inventoryQuantity < quantity) {
        throw new Error(
          `Stock insuficiente para ${variant.product.title} - ${variant.title}. Disponible: ${variant.inventoryQuantity}.`,
        );
      }

      const unitPrice = Number(variant.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(
          `Shopify devolvio un precio invalido para ${variant.product.title}`,
        );
      }

      return {
        shopifyProductId: variant.product.id,
        shopifyVariantId: variant.id,
        sku: variant.sku ?? undefined,
        productTitle: variant.product.title,
        variantTitle: variant.title,
        quantity,
        unitPrice,
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const customerId = body.customerId ? Number(body.customerId) : undefined;
    const customer = customerId
      ? await getLoyaltyCustomer(customerId)
      : undefined;
    const rule = await getActiveLoyaltyRule();
    let discount = 0;
    let pointsSpent = 0;
    let discountCode: string | undefined;
    let manualDiscountReason: string | undefined;

    if (customer && customer.status !== "active") {
      throw new Error("El cliente de puntos esta bloqueado");
    }

    if (benefitType === "points") {
      if (!customer) {
        throw new Error("Selecciona un cliente para usar puntos");
      }

      pointsSpent = Math.trunc(
        positiveAmount(body.pointsToUse, "Los puntos a usar"),
      );

      if (pointsSpent > customer.points_balance) {
        throw new Error("El cliente no tiene puntos suficientes");
      }

      discount = pointsSpent * rule.point_redemption_value_clp;
    } else if (benefitType === "discount_code") {
      discountCode = requiredText(body.discountCode, "el codigo de descuento");
      discount = positiveAmount(body.benefitAmount, "El monto del descuento");
    } else if (benefitType === "manual_discount") {
      manualDiscountReason = requiredText(
        body.manualDiscountReason,
        "la autorizacion del descuento manual",
      );
      discount = positiveAmount(body.benefitAmount, "El monto del descuento");
    }

    if (discount >= subtotal) {
      throw new Error(
        "El beneficio debe dejar un total mayor que cero para cobrar por TUU",
      );
    }

    const total = subtotal - discount;
    const pointsEarned = customer ? calculatePointsForAmount(total, rule) : 0;
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          customerId: customer?.id ?? null,
          items: items.map((item) => ({
            variantId: item.shopifyVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          benefitType,
          pointsSpent,
          discount,
          discountCode: discountCode ?? null,
          manualDiscountReason: manualDiscountReason ?? null,
          subtotal,
          total,
        }),
      )
      .digest("hex");

    attempt = await claimPhysicalSalePosAttempt({
      tuuTransactionId,
      payloadFingerprint: fingerprint,
      createdBy: responsible,
    });

    if (attempt.status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        physicalSaleId: attempt.physicalSaleId,
        shopifyOrderId: attempt.shopifyOrderId,
        shopifyOrderName: attempt.shopifyOrderName,
        pointsEarned,
        pointsSpent,
      });
    }

    if (!attempt.claimToken) {
      throw new Error("No se pudo obtener el control del intento de venta");
    }

    const shopifyOrder = await createOrFindPaidPhysicalOrder({
      tuuTransactionId,
      receiptNumber: body.receiptNumber,
      responsible,
      notes: body.notes,
      customer: customer
        ? {
            email: customer.email,
            shopifyCustomerId: customer.shopify_customer_id,
          }
        : undefined,
      items: items.map((item) => ({
        variantId: item.shopifyVariantId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount:
        discount > 0
          ? {
              code:
                benefitType === "points"
                  ? `OLFFY-PUNTOS-${pointsSpent}`
                  : benefitType === "manual_discount"
                    ? "OLFFY-DESCUENTO-MANUAL"
                    : discountCode!,
              amount: discount,
            }
          : undefined,
      total,
    });

    const result = await finalizePhysicalSalePos({
      attemptId: attempt.attemptId,
      claimToken: attempt.claimToken,
      customerId: customer?.id,
      tuuTransactionId,
      receiptNumber: body.receiptNumber,
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderName: shopifyOrder.name,
      subtotal,
      discount,
      total,
      benefitType,
      pointsSpent,
      pointsEarned,
      discountCode,
      manualDiscountReason,
      items,
      notes: body.notes,
      createdBy: responsible,
      metadata: {
        shopify_order_reused: shopifyOrder.reused,
        payment_method: "tuu",
      },
    });

    return NextResponse.json({
      success: true,
      alreadyCompleted: result.alreadyCompleted,
      physicalSaleId: result.physicalSaleId,
      shopifyOrderId: result.shopifyOrderId,
      shopifyOrderName: result.shopifyOrderName,
      subtotal,
      discount,
      total,
      pointsEarned,
      pointsSpent,
    });
  } catch (error) {
    const message = errorMessage(error);

    if (attempt?.claimToken && attempt.status === "pending") {
      await failPhysicalSalePosAttempt({
        attemptId: attempt.attemptId,
        claimToken: attempt.claimToken,
        error: message,
      });
    }

    console.error("Error completing TUU POS sale:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
