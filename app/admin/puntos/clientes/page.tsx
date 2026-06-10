import Link from "next/link";
import { searchLoyaltyCustomers } from "lib/loyalty/service";
import { createCustomerAction } from "../actions";
import { connection } from "next/server";

const numberFormatter = new Intl.NumberFormat("es-CL");

export default async function LoyaltyCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const customers = await searchLoyaltyCustomers(query, 50);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
          OLFFY Puntos
        </p>
        <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
          Clientes
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Busca por correo, telefono, nombre o identificador de Shopify.
        </p>
      </div>

      {params.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <form className="flex gap-3">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Buscar cliente"
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-md bg-olffy-purple px-4 py-2 text-sm font-semibold text-white">
              Buscar
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Saldo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {customer.full_name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-olffy-purple">
                      {numberFormatter.format(customer.points_balance)} pts
                    </td>
                    <td className="px-4 py-4">
                      {customer.status === "active" ? "Activo" : "Bloqueado"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/puntos/clientes/${customer.id}`}
                        className="font-semibold text-olffy-purple"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <form
          action={createCustomerAction}
          className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="font-semibold text-gray-900">Crear cliente</h2>
            <p className="mt-1 text-xs text-gray-500">
              El alta registra un evento futuro, pero no envia emails.
            </p>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Nombre</span>
            <input
              name="fullName"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Correo</span>
            <input
              required
              type="email"
              name="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Telefono</span>
            <input
              name="phone"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <button className="w-full rounded-md bg-olffy-ink px-4 py-2 text-sm font-semibold text-white">
            Crear cliente
          </button>
        </form>
      </div>
    </div>
  );
}
