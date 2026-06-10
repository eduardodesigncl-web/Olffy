import {
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminPassword,
} from "lib/admin/auth";
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

    if (password === adminPassword) {
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
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 },
    );
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
