import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { createReward, listRewards } from "lib/loyalty/service";
import { connection, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo procesar la recompensa";
}

export async function GET() {
  await connection();
  const unauthorized = await getAdminApiUnauthorizedResponse("recompensas");
  if (unauthorized) return unauthorized;

  try {
    const rewards = await listRewards(false);
    return NextResponse.json({ rewards });
  } catch (error) {
    console.error("Error loading rewards:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("recompensas");
  if (unauthorized) return unauthorized;

  try {
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

    if (!name) {
      throw new Error("La recompensa requiere un nombre");
    }
    if (!Number.isFinite(pointsCost) || pointsCost <= 0) {
      throw new Error("Los puntos requeridos deben ser mayores que cero");
    }

    const rewardType = body.rewardType ?? "discount";
    const discountAmountClp =
      body.discountAmountClp && Number(body.discountAmountClp) > 0
        ? Math.trunc(Number(body.discountAmountClp))
        : undefined;
    const minimumPurchaseClp = Math.max(
      Math.trunc(Number(body.minimumPurchaseClp ?? 0)) || 0,
      0,
    );
    const validityDays = Math.max(
      Math.trunc(Number(body.validityDays ?? 30)) || 30,
      1,
    );

    if (rewardType === "discount" && !discountAmountClp) {
      throw new Error("El descuento requiere un monto mayor que cero");
    }

    const reward = await createReward({
      name,
      description: body.description,
      rewardType,
      pointsCost,
      discountAmountClp,
      minimumPurchaseClp,
      validityDays,
      isActive: body.isActive ?? true,
      metadata: {},
    });

    revalidatePath("/admin/puntos/recompensas");
    revalidatePath("/cuenta/recompensas");

    return NextResponse.json({
      success: true,
      reward,
      shopifyCode: null,
      shopifyDiscountNodeId: null,
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
