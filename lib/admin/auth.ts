import "server-only";

import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "./session";

export {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "./session";

export async function hasAdminSession(): Promise<boolean> {
  const session = (await cookies()).get("admin_session");
  return verifyAdminSessionToken(session?.value);
}

export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    throw new Error("Sesion de administracion no valida");
  }
}
