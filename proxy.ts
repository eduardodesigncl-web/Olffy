import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "lib/admin/session";

export function proxy(request: NextRequest) {
  // Solo aplicamos el proxy a las rutas que empiezan con /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Si ya estamos en la página de login, no hacemos nada para evitar bucles
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Obtenemos la cookie de sesión
    const session = request.cookies.get("admin_session");

    // La validacion se repite dentro de las rutas sensibles.
    if (!verifyAdminSessionToken(session?.value)) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Para el resto de rutas, permitimos el acceso
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
