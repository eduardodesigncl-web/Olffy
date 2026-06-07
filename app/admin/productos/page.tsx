import { getAdminProducts } from "lib/shopify/admin";
import Link from "next/link";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-brand font-black text-olffy-ink">Productos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Lista de todos los productos en tu inventario.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-x-2 rounded-md bg-olffy-purple px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-olffy-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olffy-purple"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Nuevo Producto
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
                      Producto
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Estado
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Inventario
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Precio
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.map((product) => {
                    // Calculamos el inventario total sumando las cantidades de todas las variantes
                    const totalInventory = product.variants?.edges?.reduce((acc, edge) => {
                      return acc + (edge?.node?.inventoryQuantity || 0);
                    }, 0) || 0;

                    // Obtenemos el precio de la primera variante
                    const price = product.variants?.edges?.[0]?.node?.price || "0.00";
                    
                    // Obtenemos la primera imagen
                    const imageUrl = product.images?.edges?.[0]?.node?.url;

                    // Obtenemos el ID limpio (sin gid://shopify/Product/)
                    const cleanId = product.id.split("/").pop();

                    return (
                      <tr key={product.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-10 w-10 shrink-0 relative bg-gray-100 rounded-md overflow-hidden">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                  Img
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{product.title}</div>
                              <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">
                                {product.handle}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            product.status === "ACTIVE" 
                              ? "bg-green-50 text-green-700 ring-green-600/20" 
                              : product.status === "DRAFT"
                                ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                                : "bg-gray-50 text-gray-600 ring-gray-500/10"
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {totalInventory} en stock
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${parseFloat(price).toLocaleString("es-CL")}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/admin/productos/${cleanId}`}
                            className="text-olffy-purple hover:text-olffy-ink"
                          >
                            Editar<span className="sr-only">, {product.title}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                        No hay productos en el inventario.
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
