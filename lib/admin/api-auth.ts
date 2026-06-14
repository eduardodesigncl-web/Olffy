import "server-only";

import { NextResponse } from "next/server";
import { hasAdminSession } from "./auth";

export async function getAdminApiUnauthorizedResponse() {
  if (await hasAdminSession()) {
    return null;
  }

  return NextResponse.json(
    { error: "Sesion de administracion no valida" },
    { status: 401 },
  );
}
