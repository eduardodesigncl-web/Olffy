import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getAdminIntegrationDiagnostics } from "lib/admin/diagnostics";
import type { AdminIntegrationDiagnosticsResponse } from "lib/admin/diagnostics-types";
import { NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await getAdminApiUnauthorizedResponse("ajustes");
  if (unauthorized) return unauthorized;

  const checkedAt = new Date().toISOString();
  const diagnostics = await getAdminIntegrationDiagnostics();

  return NextResponse.json<AdminIntegrationDiagnosticsResponse>(
    { checkedAt, diagnostics },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
