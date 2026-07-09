import { syncRecentShopifyPaidOrders } from "lib/admin/digital-sales";
import { NextResponse } from "next/server";

function authorized(request: Request) {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.SHOPIFY_SYNC_CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 25);
  const sinceHours = Number(url.searchParams.get("sinceHours") ?? 48);

  try {
    return NextResponse.json(
      await syncRecentShopifyPaidOrders({ limit, sinceHours }),
    );
  } catch (cause) {
    console.error("Error syncing recent Shopify paid orders:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo sincronizar Shopify",
      },
      { status: 500 },
    );
  }
}

export const GET = POST;
