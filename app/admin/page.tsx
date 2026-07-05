import { getAdminProducts, getAdminCollections } from "lib/shopify/admin";
import { requireAdminPageSession } from "lib/admin/auth";
import Link from "next/link";
import { connection } from "next/server";

export default async function AdminDashboardPage() {
  await requireAdminPageSession();
  await connection();

  let productsCount = 0;
  let collectionsCount = 0;
  let activeProducts = 0;
  let draftProducts = 0;
  let error = null;

  try {
    const products = await getAdminProducts();
    const collections = await getAdminCollections();

    productsCount = products.length;
    collectionsCount = collections.length;
    activeProducts = products.filter((p) => p.status === "ACTIVE").length;
    draftProducts = products.filter((p) => p.status === "DRAFT").length;
  } catch (e) {
    console.error("Error loading admin stats:", e);
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e && "error" in e && e.error instanceof Error
          ? e.error.message
          : "";

    if (
      message.includes("SHOPIFY_ADMIN_STORE_DOMAIN") ||
      message.includes("SHOPIFY_STORE_DOMAIN")
    ) {
      error =
        "Error al conectar con Shopify Admin API. Falta SHOPIFY_ADMIN_STORE_DOMAIN o debe usar el dominio tecnico .myshopify.com.";
    } else if (
      message.includes("SHOPIFY_ADMIN_API_ACCESS_TOKEN") ||
      message.includes("SHOPIFY_ADMIN_API_CLIENT_ID") ||
      message.includes("Client ID")
    ) {
      error = `Error de autenticacion con Shopify Admin API. ${message}`;
    } else {
      error = `Error al conectar con Shopify Admin API. ${message || "Revisa el token Admin API y los permisos de productos/colecciones."}`;
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-olffy-purple">
            OLFFY Admin
          </p>
          <h1 className="mt-1 font-brand text-2xl font-bold text-olffy-ink/90">
            Buen día, OLFFY
          </h1>
          <p className="mt-1 text-sm text-olffy-ink/50">
            Estado operativo de tienda, productos y accesos rápidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/puntos/clientes"
            className="rounded-[10px] border border-olffy-ink/15 bg-white px-4 py-2.5 text-[13px] font-medium text-olffy-ink/70 transition hover:border-olffy-purple"
          >
            Ver clientes
          </Link>
          <Link
            href="/admin/puntos/ventas"
            className="rounded-[10px] bg-olffy-purple px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            + Venta TUU
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-olffy-ink/10 bg-white p-5">
            <p className="text-[13px] text-olffy-ink/50">Total Productos</p>
            <p className="mt-2 font-brand text-[32px] leading-none text-olffy-ink/90">
              {productsCount}
            </p>
          </div>
          <div className="rounded-xl border border-olffy-ink/10 bg-white p-5">
            <p className="text-[13px] text-olffy-ink/50">Productos Activos</p>
            <p className="mt-2 font-brand text-[32px] leading-none text-green-600">
              {activeProducts}
            </p>
          </div>
          <div className="rounded-xl border border-olffy-ink/10 bg-white p-5">
            <p className="text-[13px] text-olffy-ink/50">Borradores</p>
            <p className="mt-2 font-brand text-[32px] leading-none text-yellow-600">
              {draftProducts}
            </p>
          </div>
          <div className="rounded-xl border border-olffy-ink/10 bg-white p-5">
            <p className="text-[13px] text-olffy-ink/50">Colecciones</p>
            <p className="mt-2 font-brand text-[32px] leading-none text-olffy-purple">
              {collectionsCount}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-olffy-ink/10 bg-white p-6">
          <div>
            <h2 className="font-brand text-[20px] font-bold text-olffy-ink/90">
              Gestión de Productos
            </h2>
            <p className="mt-1 text-sm text-olffy-ink/50">
              Crea, edita o elimina productos de tu inventario.
            </p>
          </div>
          <Link
            href="/admin/productos"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-olffy-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Ver productos
          </Link>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-olffy-ink/10 bg-white p-6">
          <div>
            <h2 className="font-brand text-[20px] font-bold text-olffy-ink/90">
              Gestión de Colecciones
            </h2>
            <p className="mt-1 text-sm text-olffy-ink/50">
              Organiza tus productos en categorías.
            </p>
          </div>
          <Link
            href="/admin/colecciones"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-olffy-ink/15 bg-white px-4 py-2.5 text-sm font-medium text-olffy-ink/70 transition hover:border-olffy-purple"
          >
            Ver colecciones
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAdminLink
          href="/admin/puntos/clientes"
          title="Clientes"
          detail="Buscar saldos y revisar historial."
        />
        <QuickAdminLink
          href="/admin/puntos/ventas"
          title="Venta TUU"
          detail="Registrar venta presencial."
          highlight
        />
        <QuickAdminLink
          href="/admin/puntos/recompensas"
          title="Recompensas"
          detail="Gestionar beneficios activos."
        />
        <QuickAdminLink
          href="/admin/operaciones"
          title="Operaciones"
          detail="Pago, boleta, puntos y marketing."
        />
      </div>
    </div>
  );
}

function QuickAdminLink({
  href,
  title,
  detail,
  highlight = false,
}: {
  href: string;
  title: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 transition ${
        highlight
          ? "border-olffy-purple bg-[#DEDDF2]"
          : "border-olffy-ink/10 bg-white hover:border-olffy-purple"
      }`}
    >
      <p className="font-semibold text-olffy-ink/90">{title}</p>
      <p className="mt-1 text-xs leading-5 text-olffy-ink/50">{detail}</p>
    </Link>
  );
}
