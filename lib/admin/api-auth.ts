import "server-only";

import { NextResponse } from "next/server";
import { getAdminSessionActor } from "./auth";
import type { AdminPermission } from "./session";

export async function getAdminApiUnauthorizedResponse(
  permission?: AdminPermission | AdminPermission[],
) {
  const actor = await getAdminSessionActor();
  const required = Array.isArray(permission)
    ? permission
    : permission
      ? [permission]
      : [];
  if (
    actor &&
    (required.length === 0 ||
      required.some((item) => actor.permissions.includes(item)))
  ) {
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
