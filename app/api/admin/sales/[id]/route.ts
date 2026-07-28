import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getAdminSaleDetailRecord } from "lib/admin/digital-sales";
import { NextResponse } from "next/server";
import { toUnifiedSale } from "src/admin-panel/integration/get-admin-panel-data";
import type { UnifiedSaleDetail } from "src/admin-panel/integration/types";

function clp(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse("ventas");
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Venta inválida" }, { status: 400 });
    }

    const detail = await getAdminSaleDetailRecord(id);
    const summary = toUnifiedSale(detail.order);
    const adjustments = detail.total - (detail.subtotal - detail.discount);
    const sale: UnifiedSaleDetail = {
      ...summary,
      subtotal: clp(detail.subtotal),
      subtotalN: detail.subtotal,
      descuento: clp(detail.discount),
      descuentoN: detail.discount,
      ajustes: clp(adjustments),
      ajustesN: adjustments,
      responsable: detail.responsible,
      numeroComprobante: detail.receiptNumber,
      notas: detail.notes,
      productos: detail.items.map((item) => ({
        id: item.id,
        shopifyProductId: item.shopifyProductId,
        shopifyVariantId: item.shopifyVariantId,
        imageUrl: item.imageUrl,
        imageAlt: item.imageAlt || item.productTitle,
        nombre: item.productTitle,
        variante:
          item.variantTitle && item.variantTitle !== "Default Title"
            ? item.variantTitle
            : null,
        sku: item.sku,
        qty: item.quantity,
        precio: clp(item.unitPrice),
        precioN: item.unitPrice,
        descuento: clp(item.allocatedDiscount),
        descuentoN: item.allocatedDiscount,
        pagado: clp(item.paidTotal),
        pagadoN: item.paidTotal,
        elegible: item.eligible,
      })),
    };

    return NextResponse.json({ sale });
  } catch (cause) {
    console.error("No se pudo cargar el detalle de venta:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar el detalle de la venta",
      },
      { status: 404 },
    );
  }
}
