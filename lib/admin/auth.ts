import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "lib/supabase/admin";
import {
  readAdminSessionToken,
  type AdminPermission,
  type AdminSessionActor,
} from "./session";

export {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "./session";

export async function hasAdminSession(): Promise<boolean> {
  return Boolean(await getAdminSessionActor());
}

export async function getAdminSessionActor(): Promise<AdminSessionActor | null> {
  const token = (await cookies()).get("admin_session")?.value;
  const actor = readAdminSessionToken(token);
  if (!actor || actor.legacy || !actor.userId) return actor;

  const { data, error } = await getSupabaseAdmin()
    .from("admin_accounts")
    .select("email,full_name,role,permissions,status,updated_at")
    .eq("auth_user_id", actor.userId)
    .maybeSingle();
  if (error || !data || data.status !== "active") return null;
  if (!actor.sessionVersion || actor.sessionVersion !== data.updated_at) {
    return null;
  }

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
  if (!(await getAdminSessionActor())) {
    throw new Error("Sesion de administracion no valida");
  }
}

export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminSessionActor> {
  const actor = await getAdminSessionActor();
  if (!actor) throw new Error("Sesion de administracion no valida");
  if (!actor.permissions.includes(permission)) {
    throw new Error("No tienes permiso para realizar esta acción");
  }
  return actor;
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
