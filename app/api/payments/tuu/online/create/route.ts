import { startOnlinePayment } from "lib/transactions/online";
import { isTuuOnlineEnabled } from "lib/tuu/config";
import { NextResponse } from "next/server";

type Body = {
  requestId?: string;
  customerEmail?: string;
  items?: Array<{ variantId?: string; quantity?: number }>;
};

export async function POST(request: Request) {
  if (!isTuuOnlineEnabled()) {
    return NextResponse.json(
      { error: "Los pagos TUU online no estan habilitados" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Body;
    const result = await startOnlinePayment({
      requestId: body.requestId,
      customerEmail: body.customerEmail,
      items: (body.items ?? []).map((item) => ({
        variantId: String(item.variantId ?? ""),
        quantity: Number(item.quantity),
      })),
    });

    return NextResponse.json(result);
  } catch (cause) {
    console.error("Error creating TUU online payment:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo crear el pago TUU",
      },
      { status: 400 },
    );
  }
}
