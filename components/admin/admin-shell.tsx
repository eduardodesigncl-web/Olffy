"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Cuenta cliente", href: "/admin/cuenta" },
    { name: "Puntos", href: "/admin/puntos" },
    { name: "Operaciones", href: "/admin/operaciones" },
    { name: "Ventas digitales", href: "/admin/ventas-digitales" },
    { name: "Productos", href: "/admin/productos" },
    { name: "Colecciones", href: "/admin/colecciones" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#f5f5f5]">
      <aside className="sticky top-0 h-[calc(100vh-64px)] w-[210px] shrink-0 border-r border-olffy-ink/10 bg-white">
        <div className="flex h-full flex-col">
          <div className="border-b border-olffy-ink/10 px-5 py-5">
            <span className="font-brand text-[17px] font-bold text-olffy-ink/90">
              OLFFY
            </span>
            <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-olffy-ink/35">
              Admin Panel
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-olffy-cream font-semibold text-olffy-ink"
                      : "text-olffy-ink/60 hover:bg-olffy-ink/[0.03] hover:text-olffy-ink"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-olffy-ink/10 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-lg border border-olffy-ink/15 bg-white px-4 py-2.5 text-[13px] font-medium text-olffy-ink/60 transition hover:bg-olffy-ink/[0.03] focus:outline-none focus:ring-2 focus:ring-olffy-purple"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
