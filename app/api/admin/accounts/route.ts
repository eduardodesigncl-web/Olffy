import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "lib/admin/session";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { NextResponse } from "next/server";

const ROLE_PERMISSIONS: Record<
  Exclude<AdminRole, "custom">,
  AdminPermission[]
> = {
  owner: [...ADMIN_PERMISSIONS],
  manager: [
    "dashboard",
    "ventas",
    "pos",
    "clientes",
    "puntos",
    "recompensas",
    "productos",
    "colecciones",
  ],
  cashier: ["dashboard", "ventas", "pos", "clientes"],
};

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo guardar la cuenta";
}

function normalizedPermissions(role: AdminRole, value: unknown) {
  if (role !== "custom") return ROLE_PERMISSIONS[role];
  const requested = Array.isArray(value) ? value.map(String) : [];
  const permissions = ADMIN_PERMISSIONS.filter((permission) =>
    requested.includes(permission),
  );
  if (permissions.length === 0) {
    throw new Error("Selecciona al menos una pestaña para la cuenta");
  }
  return permissions;
}

function validRole(value: unknown): AdminRole {
  const role = String(value ?? "custom") as AdminRole;
  if (!["owner", "manager", "cashier", "custom"].includes(role)) {
    throw new Error("El rol seleccionado no es válido");
  }
  return role;
}

export async function GET() {
  const unauthorized = await getAdminApiUnauthorizedResponse("ajustes");
  if (unauthorized) return unauthorized;

  const { data, error } = await getSupabaseAdmin()
    .from("admin_accounts")
    .select(
      "id,auth_user_id,email,full_name,role,permissions,status,created_at",
    )
    .order("created_at", { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("ajustes");
  if (unauthorized) return unauthorized;

  let authUserId: string | null = null;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const role = validRole(body.role);
    const permissions = normalizedPermissions(role, body.permissions);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Ingresa un email válido");
    }
    if (fullName.length < 2) throw new Error("Ingresa el nombre de la cuenta");
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    }

    const supabase = getSupabaseAdmin();
    const { data: created, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { admin_account: true },
      });
    if (authError || !created.user) {
      throw new Error(authError?.message || "No se pudo crear el acceso");
    }
    authUserId = created.user.id;

    const { data, error } = await supabase
      .from("admin_accounts")
      .insert({
        auth_user_id: authUserId,
        email,
        full_name: fullName,
        role,
        permissions,
        status: "active",
      })
      .select(
        "id,auth_user_id,email,full_name,role,permissions,status,created_at",
      )
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, account: data });
  } catch (error) {
    if (authUserId) {
      await getSupabaseAdmin()
        .auth.admin.deleteUser(authUserId)
        .catch(() => {});
    }
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("ajustes");
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    const status = body.status === "disabled" ? "disabled" : "active";
    const role = validRole(body.role);
    const permissions = normalizedPermissions(role, body.permissions);
    if (!id || fullName.length < 2) throw new Error("Cuenta inválida");

    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from("admin_accounts")
      .select("auth_user_id,role,status")
      .eq("id", id)
      .single();
    if (currentError) throw new Error(currentError.message);

    if (
      current.role === "owner" &&
      current.status === "active" &&
      status === "disabled"
    ) {
      const { count } = await supabase
        .from("admin_accounts")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner")
        .eq("status", "active");
      if ((count ?? 0) <= 1)
        throw new Error("No puedes deshabilitar la última cuenta propietaria");
    }

    if (password) {
      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }
      const { error } = await supabase.auth.admin.updateUserById(
        current.auth_user_id,
        { password },
      );
      if (error) throw new Error(error.message);
    }

    const { data, error } = await supabase
      .from("admin_accounts")
      .update({
        full_name: fullName,
        role,
        permissions,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id,auth_user_id,email,full_name,role,permissions,status,created_at",
      )
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, account: data });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}
