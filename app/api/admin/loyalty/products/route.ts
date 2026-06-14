import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { searchAdminProductVariants } from "lib/shopify/admin";
import { connection, NextResponse } from "next/server";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo buscar productos";
}

export async function GET(request: Request) {
  await connection();
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const variants = await searchAdminProductVariants(query, 30);

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Error searching Shopify variants:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
