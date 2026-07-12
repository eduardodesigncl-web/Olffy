import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { issueAutomaticRewardRedemption } from "lib/loyalty/automatic-redemptions";
import { getLoyaltyCustomer } from "lib/loyalty/service";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo canjear la recompensa";
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      customerId?: number;
      rewardId?: number;
      responsible?: string;
    };
    const customerId = Number(body.customerId);
    const rewardId = Number(body.rewardId);
    const responsible = String(body.responsible ?? "Equipo OLFFY").trim();

    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
      throw new Error("Selecciona una clienta válida");
    }
    if (!Number.isSafeInteger(rewardId) || rewardId <= 0) {
      throw new Error("Selecciona una recompensa válida");
    }

    const result = await issueAutomaticRewardRedemption({
      customerId,
      rewardId,
      createdBy: `admin:pos:${responsible || "Equipo OLFFY"}`,
      metadata: {
        channel: "admin_pos",
        responsible: responsible || "Equipo OLFFY",
      },
    });
    const customer = await getLoyaltyCustomer(customerId);

    revalidatePath("/admin/pos");
    revalidatePath("/cuenta/canjes");
    revalidatePath("/cuenta/recompensas");

    return NextResponse.json({
      success: true,
      redemptionId: result.redemptionId,
      code: result.code,
      pointsBalance: customer.points_balance,
    });
  } catch (error) {
    console.error("Error issuing POS reward redemption:", error);
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}
