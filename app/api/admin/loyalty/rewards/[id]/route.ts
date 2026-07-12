import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { updateReward } from "lib/loyalty/service";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo actualizar la recompensa";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse("recompensas");
  if (unauthorized) return unauthorized;

  try {
    const rewardId = Number((await params).id);
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      rewardType?: "discount" | "product" | "experience" | "other";
      pointsCost?: number;
      discountAmountClp?: number | null;
      minimumPurchaseClp?: number;
      validityDays?: number;
      isActive?: boolean;
    };
    const name = String(body.name ?? "").trim();
    const pointsCost = Math.trunc(Number(body.pointsCost));
    const rewardType = body.rewardType ?? "discount";
    const discountAmountClp =
      rewardType === "discount"
        ? Math.trunc(Number(body.discountAmountClp))
        : null;
    const minimumPurchaseClp = Math.max(
      Math.trunc(Number(body.minimumPurchaseClp ?? 0)) || 0,
      0,
    );
    const validityDays = Math.max(
      Math.trunc(Number(body.validityDays ?? 30)) || 30,
      1,
    );

    if (!Number.isSafeInteger(rewardId) || rewardId <= 0) {
      throw new Error("Recompensa inválida");
    }
    if (!name) throw new Error("La recompensa requiere un nombre");
    if (!Number.isFinite(pointsCost) || pointsCost <= 0) {
      throw new Error("Los puntos requeridos deben ser mayores que cero");
    }
    if (
      rewardType === "discount" &&
      (!discountAmountClp || discountAmountClp <= 0)
    ) {
      throw new Error("El descuento requiere un monto mayor que cero");
    }

    const reward = await updateReward(rewardId, {
      name,
      description: body.description,
      rewardType,
      pointsCost,
      discountAmountClp,
      minimumPurchaseClp,
      validityDays,
      isActive: body.isActive,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pos");
    revalidatePath("/cuenta/recompensas");
    return NextResponse.json({ success: true, reward });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}
