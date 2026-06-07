import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "La contraseña de administrador no está configurada." },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/admin",
        maxAge: 60 * 60 * 24 * 7, // 1 semana
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Contraseña incorrecta." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true });
}
