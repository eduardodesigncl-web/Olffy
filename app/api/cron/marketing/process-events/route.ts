import { processMarketingOutbox } from "lib/transactions/marketing";
import { NextResponse } from "next/server";

function authorized(request: Request) {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.MARKETING_CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    return NextResponse.json(await processMarketingOutbox());
  } catch (cause) {
    console.error("Error processing marketing outbox:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo procesar la cola",
      },
      { status: 500 },
    );
  }
}

export const GET = POST;
