import "server-only";

import { cookies } from "next/headers";

export async function requireAdminSession(): Promise<void> {
  const session = (await cookies()).get("admin_session");

  if (session?.value !== "true") {
    throw new Error("Sesion de administracion no valida");
  }
}
