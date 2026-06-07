import { getAdminProducts, getAdminCollections } from "lib/shopify/admin";
import Link from "next/link";

export default async function AdminDashboard() {
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
    error = "Error al conectar con Shopify. Asegúrate de configurar SHOPIFY_ADMIN_API_ACCESS_TOKEN.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-brand font-black text-olffy-ink">Dashboard</h1>

      {error ? (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Productos</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{productsCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Productos Activos</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">{activeProducts}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Borradores</p>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">{draftProducts}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Colecciones</p>
            <p className="mt-2 text-3xl font-semibold text-olffy-purple">{collectionsCount}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 mt-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Gestión de Productos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Crea, edita o elimina productos de tu inventario.
            </p>
          </div>
          <Link
            href="/admin/productos"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-olffy-purple px-4 py-2 text-sm font-medium text-white hover:bg-olffy-ink transition-colors"
          >
            Ver productos
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Gestión de Colecciones</h2>
            <p className="mt-1 text-sm text-gray-500">
              Organiza tus productos en categorías.
            </p>
          </div>
          <Link
            href="/admin/colecciones"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ver colecciones
          </Link>
        </div>
      </div>
    </div>
  );
}
