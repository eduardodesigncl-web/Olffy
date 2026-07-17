import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getTuuRemotePayment } from "lib/tuu/remote-payment";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ idempotencyKey: string }> },
) {
  const unauthorized = await getAdminApiUnauthorizedResponse("pos");
  if (unauthorized) return unauthorized;

  try {
    const { idempotencyKey } = await params;
    return NextResponse.json(await getTuuRemotePayment(idempotencyKey));
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo consultar el cobro TUU",
      },
      { status: 400 },
    );
  }
}
