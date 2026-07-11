import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { listLoyaltyRuleVersions, publishLoyaltyRule } from "lib/loyalty/rules";
import { connection, NextResponse } from "next/server";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo procesar la regla de puntos";
}

export async function GET() {
  await connection();
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const versions = await listLoyaltyRuleVersions();
    return NextResponse.json({
      active: versions.find((version) => version.is_active) ?? null,
      versions,
    });
  } catch (error) {
    console.error("Error loading loyalty rules:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      name?: string;
      spendingUnitClp?: number;
      pointsPerUnit?: number;
      pointRedemptionValueClp?: number;
      pointsExpiryMonths?: number;
      redemptionExpiryDays?: number;
      createdBy?: string;
      notes?: string;
    };

    const ruleId = await publishLoyaltyRule({
      name: String(body.name ?? "").trim(),
      spendingUnitClp: Number(body.spendingUnitClp),
      pointsPerUnit: Number(body.pointsPerUnit),
      pointRedemptionValueClp: Number(body.pointRedemptionValueClp),
      pointsExpiryMonths: Number(body.pointsExpiryMonths),
      redemptionExpiryDays: Number(body.redemptionExpiryDays),
      createdBy: String(body.createdBy ?? "").trim(),
      notes: body.notes,
    });

    const versions = await listLoyaltyRuleVersions();

    return NextResponse.json({
      success: true,
      ruleId,
      active: versions.find((version) => version.is_active) ?? null,
      versions,
    });
  } catch (error) {
    console.error("Error publishing loyalty rule:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
