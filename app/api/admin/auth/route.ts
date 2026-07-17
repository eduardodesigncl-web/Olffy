import {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "lib/admin/auth";
import {
  adminLoginKeyHash,
  checkAdminLoginRateLimit,
  recordAdminLoginAttempt,
} from "lib/admin/rate-limit";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getSupabasePublicConfig } from "lib/supabase/config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const adminPassword = getAdminPassword();

    if (!normalizedEmail && !adminPassword) {
      return NextResponse.json(
        { error: "La contraseña de administrador no está configurada." },
        { status: 500 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const ipHash = adminLoginKeyHash(ip, normalizedEmail || "legacy-access");
    const rateLimit = await checkAdminLoginRateLimit(ipHash);

    if (!rateLimit.allowed) {
      const retryMinutes = Math.max(1, Math.ceil(rateLimit.retryAfter / 60));
      return NextResponse.json(
        {
          error: `Demasiados intentos para esta cuenta. Intenta nuevamente en ${retryMinutes} min.`,
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    let matches = false;
    let sessionToken = "";

    if (normalizedEmail) {
      const { url, key } = getSupabasePublicConfig();
      const authClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      });
      const { data: authData, error: authError } =
        await authClient.auth.signInWithPassword({
          email: normalizedEmail,
          password: String(password ?? ""),
        });

      if (!authError && authData.user) {
        const { data: account } = await getSupabaseAdmin()
          .from("admin_accounts")
          .select(
            "auth_user_id,email,full_name,role,permissions,status,updated_at",
          )
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();
        if (account?.status === "active") {
          matches = true;
          sessionToken = createAdminSessionToken({
            userId: account.auth_user_id,
            email: account.email,
            name: account.full_name,
            role: account.role,
            permissions: account.permissions,
            sessionVersion: account.updated_at,
          });
        }
      }
    } else {
      const provided = Buffer.from(String(password ?? ""));
      const expected = Buffer.from(adminPassword!);
      matches =
        provided.length === expected.length &&
        timingSafeEqual(provided, expected);
      if (matches) sessionToken = createAdminSessionToken();
    }

    await recordAdminLoginAttempt(ipHash, matches);

    if (matches) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_SESSION_MAX_AGE,
      });

      return NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Email o contraseña incorrectos, o cuenta deshabilitada." },
      { status: 401 },
    );
  } catch (error) {
    console.error("Error processing admin login:", error);
    const message =
      error instanceof Error && error.message.includes("ADMIN_SESSION_SECRET")
        ? "Falta configurar ADMIN_SESSION_SECRET o ADMIN_PASSWORD en el deploy."
        : "Error procesando la solicitud.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
