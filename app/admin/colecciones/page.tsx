import { getAdminCollections } from "lib/shopify/admin";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await getAdminCollections();

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-brand font-black text-olffy-ink">Colecciones</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todas las colecciones (categorías) de tu tienda.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/colecciones/nuevo"
            className="inline-flex items-center gap-x-2 rounded-md bg-olffy-purple px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-olffy-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olffy-purple"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Nueva Colección
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Título
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Handle
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Productos
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {collections.map((collection) => {
                    const cleanId = collection.id.split("/").pop();

                    return (
                      <tr key={collection.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {collection.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {collection.handle}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {collection.productsCount?.count || 0}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/admin/colecciones/${cleanId}`}
                            className="text-olffy-purple hover:text-olffy-ink"
                          >
                            Editar<span className="sr-only">, {collection.title}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {collections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                        No hay colecciones en la tienda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
