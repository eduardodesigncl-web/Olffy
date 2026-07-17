import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import {
  isAdminRole,
  normalizeAdminPermissions,
  type AdminRole,
} from "lib/admin/permissions";
import { getAdminSessionActor } from "lib/admin/auth";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { NextResponse } from "next/server";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo guardar la cuenta";
}

function normalizedPermissions(role: AdminRole, value: unknown) {
  const permissions = normalizeAdminPermissions(role, value);
  if (permissions.length === 0) {
    throw new Error("Selecciona al menos una pestaña para la cuenta");
  }
  return permissions;
}

function validRole(value: unknown): AdminRole {
  const role = String(value ?? "custom");
  if (!isAdminRole(role)) {
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
        app_metadata: { admin_account: true, admin_role: role },
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
  const actor = await getAdminSessionActor();

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
      (status === "disabled" || role !== "owner")
    ) {
      const { count } = await supabase
        .from("admin_accounts")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner")
        .eq("status", "active");
      if ((count ?? 0) <= 1)
        throw new Error(
          "No puedes deshabilitar ni cambiar el rol de la última cuenta propietaria",
        );
    }

    if (current.auth_user_id === actor?.userId && status === "disabled") {
      throw new Error("No puedes deshabilitar la cuenta con la sesión actual");
    }

    const { data: authUser, error: authUserError } =
      await supabase.auth.admin.getUserById(current.auth_user_id);
    if (authUserError || !authUser.user) {
      throw new Error(authUserError?.message || "Acceso de Auth no encontrado");
    }

    const authUpdate: {
      password?: string;
      app_metadata: Record<string, unknown>;
    } = {
      app_metadata: {
        ...authUser.user.app_metadata,
        admin_account: true,
        admin_role: role,
      },
    };

    if (password) {
      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }
      authUpdate.password = password;
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      current.auth_user_id,
      authUpdate,
    );
    if (authUpdateError) throw new Error(authUpdateError.message);

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
