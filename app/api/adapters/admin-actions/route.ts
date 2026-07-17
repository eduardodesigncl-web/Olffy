import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { adjustCustomerPoints, redeemReward } from "lib/loyalty/service";
import {
  approveRewardRedemption,
  cancelShopifyRewardRedemption,
} from "lib/loyalty/redemptions";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { issueOrderBoleta } from "lib/transactions/dte";
import { getOrderReferenceById } from "lib/transactions/repository";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type AdminAction =
  | "adjustCustomerPoints"
  | "createRedemption"
  | "approveRedemption"
  | "rejectRedemption"
  | "retryBoleta";

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function finiteNumber(value: unknown, label: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new Error(`${label} no es válido`);
  }

  return amount;
}

async function retryBoletaForId(id: string) {
  const trimmed = text(id);

  if (!trimmed) {
    throw new Error("La venta u operación seleccionada no es válida");
  }

  if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
    const orderRef = await getOrderReferenceById(trimmed);
    return issueOrderBoleta(orderRef);
  }

  const saleId = Number(trimmed);

  if (!Number.isSafeInteger(saleId) || saleId <= 0) {
    throw new Error("La venta seleccionada no es válida");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("olffy_order_refs")
    .select("*")
    .eq("physical_sale_id", saleId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la operación OLFFY: ${error.message}`);
  }

  if (!data) {
    throw new Error("La venta no tiene una operación OLFFY asociada");
  }

  return issueOrderBoleta(data);
}

export async function POST(request: Request) {
  try {
    const unauthorized = await getAdminApiUnauthorizedResponse();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as {
      action?: AdminAction;
      payload?: Record<string, unknown>;
    };
    const payload = body.payload ?? {};

    switch (body.action) {
      case "adjustCustomerPoints": {
        const customerId = finiteNumber(payload.customerId, "customerId");
        const points = finiteNumber(payload.amount, "amount");
        const balance = await adjustCustomerPoints({
          customerId,
          points,
          reason: text(payload.reason) || "Ajuste manual de puntos",
          createdBy: text(payload.createdBy) || "OLFFY Admin",
          externalReference: text(payload.externalReference),
          metadata: {
            comprobante: text(payload.comprobante),
          },
        });

        revalidatePath("/admin/puntos");
        revalidatePath(`/admin/puntos/clientes/${customerId}`);
        revalidatePath("/cuenta");

        return NextResponse.json({ success: true, balance });
      }

      case "createRedemption": {
        const customerId = finiteNumber(payload.customerId, "customerId");
        const rewardId = finiteNumber(payload.rewardId, "rewardId");
        const redemption = await redeemReward({
          customerId,
          rewardId,
          createdBy: text(payload.createdBy) || "OLFFY Admin",
        });

        revalidatePath("/admin/puntos");
        revalidatePath(`/admin/puntos/clientes/${customerId}`);
        revalidatePath("/cuenta");
        revalidatePath("/cuenta/canjes");

        return NextResponse.json({ success: true, redemption });
      }

      case "approveRedemption": {
        const redemptionId = finiteNumber(payload.redemptionId, "redemptionId");
        const redemption = await approveRewardRedemption({
          redemptionId,
          createdBy: text(payload.approvedBy) || "OLFFY Admin",
        });

        revalidatePath("/admin/puntos");
        revalidatePath("/cuenta");
        revalidatePath("/cuenta/canjes");

        return NextResponse.json({ success: true, redemption });
      }

      case "rejectRedemption": {
        const redemptionId = finiteNumber(payload.redemptionId, "redemptionId");
        await cancelShopifyRewardRedemption({
          redemptionId,
          reason: text(payload.reason) || "Canje rechazado por administración",
          createdBy: text(payload.createdBy) || "OLFFY Admin",
        });

        revalidatePath("/admin/puntos");
        revalidatePath("/cuenta");
        revalidatePath("/cuenta/canjes");

        return NextResponse.json({ success: true });
      }

      case "retryBoleta": {
        const taxDocument = await retryBoletaForId(text(payload.saleId));

        revalidatePath("/admin/operaciones");
        revalidatePath("/admin/puntos/ventas");

        return NextResponse.json({ success: true, taxDocument });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Acción admin no soportada" },
          { status: 400 },
        );
    }
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Ocurrió un error inesperado";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
