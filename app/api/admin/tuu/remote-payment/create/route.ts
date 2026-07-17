import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { createTuuRemotePayment } from "lib/tuu/remote-payment";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("pos");
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      idempotencyKey?: string;
      amount?: number;
      description?: string;
    };
    const idempotencyKey = String(body.idempotencyKey ?? "").trim();
    const amount = Number(body.amount);

    if (!idempotencyKey || !Number.isInteger(amount) || amount <= 0) {
      throw new Error("Referencia y monto TUU son obligatorios");
    }

    return NextResponse.json(
      await createTuuRemotePayment({
        idempotencyKey,
        amount,
        currency: "CLP",
        description: String(body.description ?? "Venta OLFFY").trim(),
      }),
    );
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo enviar el cobro TUU",
      },
      { status: 400 },
    );
  }
}
