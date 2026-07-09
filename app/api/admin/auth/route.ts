import {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "lib/admin/auth";
import {
  adminLoginIpHash,
  checkAdminLoginRateLimit,
  recordAdminLoginAttempt,
} from "lib/admin/rate-limit";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = getAdminPassword();

    if (!adminPassword) {
      return NextResponse.json(
        { error: "La contraseña de administrador no está configurada." },
        { status: 500 },
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const ipHash = adminLoginIpHash(ip);
    const rateLimit = await checkAdminLoginRateLimit(ipHash);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente mas tarde." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    const provided = Buffer.from(String(password ?? ""));
    const expected = Buffer.from(adminPassword);
    const matches =
      provided.length === expected.length &&
      timingSafeEqual(provided, expected);

    await recordAdminLoginAttempt(ipHash, matches);

    if (matches) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", createAdminSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_SESSION_MAX_AGE,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Contraseña incorrecta." },
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
  return NextResponse.json({ success: true });
}
