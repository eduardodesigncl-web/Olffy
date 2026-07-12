import "server-only";

import { NextResponse } from "next/server";
import { getAdminSessionActor } from "./auth";
import type { AdminPermission } from "./session";

export async function getAdminApiUnauthorizedResponse(
  permission?: AdminPermission,
) {
  const actor = await getAdminSessionActor();
  if (actor && (!permission || actor.permissions.includes(permission))) {
    return null;
  }

  return NextResponse.json(
    {
      error: actor
        ? "No tienes permiso para realizar esta acción"
        : "Sesion de administracion no valida",
    },
    { status: actor ? 403 : 401 },
  );
}
