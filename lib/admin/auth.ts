import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "lib/supabase/admin";
import {
  readAdminSessionToken,
  type AdminPermission,
  type AdminSessionActor,
  verifyAdminSessionToken,
} from "./session";

export {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "./session";

export async function hasAdminSession(): Promise<boolean> {
  const session = (await cookies()).get("admin_session");
  return verifyAdminSessionToken(session?.value);
}

export async function getAdminSessionActor(): Promise<AdminSessionActor | null> {
  const token = (await cookies()).get("admin_session")?.value;
  const actor = readAdminSessionToken(token);
  if (!actor || actor.legacy || !actor.userId) return actor;

  const { data, error } = await getSupabaseAdmin()
    .from("admin_accounts")
    .select("email,full_name,role,permissions,status")
    .eq("auth_user_id", actor.userId)
    .maybeSingle();
  if (error || !data || data.status !== "active") return null;

  return {
    ...actor,
    email: data.email,
    name: data.full_name,
    role: data.role,
    permissions: data.permissions,
  } as AdminSessionActor;
}

export async function hasAdminPermission(permission: AdminPermission) {
  const actor = await getAdminSessionActor();
  return Boolean(actor?.permissions.includes(permission));
}

export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) {
    throw new Error("Sesion de administracion no valida");
  }
}

export async function requireAdminPageSession(): Promise<AdminSessionActor> {
  const actor = await getAdminSessionActor();
  if (!actor) {
    redirect("/admin/login");
  }
  return actor;
}

export async function requireAdminPagePermission(
  permission: AdminPermission,
): Promise<AdminSessionActor> {
  const actor = await requireAdminPageSession();
  if (!actor.permissions.includes(permission)) redirect("/admin");
  return actor;
}
