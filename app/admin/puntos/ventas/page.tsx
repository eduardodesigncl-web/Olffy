import {
  getActiveLoyaltyRule,
  listPhysicalSales,
  searchLoyaltyCustomers,
} from "lib/loyalty/service";
import { registerPhysicalSaleAction } from "../actions";
import { connection } from "next/server";

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function PhysicalSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const [sales, customers, rule] = await Promise.all([
    listPhysicalSales(),
    searchLoyaltyCustomers("", 100),
    getActiveLoyaltyRule(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
          OLFFY Puntos
        </p>
        <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
          Ventas fisicas TUU
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Registra el monto efectivamente pagado. La regla activa entrega{" "}
          {rule.points_per_unit} puntos por cada{" "}
          {currencyFormatter.format(rule.spending_unit_clp)}.
        </p>
      </div>

      {params.created ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Venta TUU registrada correctamente.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          action={registerPhysicalSaleAction}
          className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="font-semibold text-gray-900">Registrar venta</h2>
            <p className="mt-1 text-xs text-gray-500">
              Si no seleccionas cliente, la venta queda anonima y no acumula
              puntos.
            </p>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Cliente</span>
            <select
              name="customerId"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">Venta anonima</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name || customer.email} ·{" "}
                  {customer.points_balance} pts
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              Referencia transaccion TUU
            </span>
            <input
              required
              name="tuuTransactionId"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Comprobante</span>
            <input
              name="receiptNumber"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Total pagado</span>
              <input
                required
                min="1"
                type="number"
                name="total"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Descuento</span>
              <input
                min="0"
                type="number"
                name="discount"
                defaultValue="0"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Responsable</span>
            <input
              required
              name="createdBy"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Notas</span>
            <textarea
              name="notes"
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <button className="w-full rounded-md bg-olffy-orange px-4 py-2 text-sm font-semibold text-white">
            Registrar venta TUU
          </button>
        </form>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Referencia</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-4 text-gray-500">
                    {dateFormatter.format(new Date(sale.sold_at))}
                  </td>
                  <td className="px-4 py-4 text-gray-900">
                    {sale.loyalty_customers?.full_name ||
                      sale.loyalty_customers?.email ||
                      "Venta anonima"}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-600">
                    {sale.tuu_transaction_id}
                  </td>
                  <td className="px-4 py-4 font-semibold">
                    {currencyFormatter.format(sale.total)}
                  </td>
                  <td className="px-4 py-4 text-olffy-purple">
                    {sale.points_earned}
                  </td>
                </tr>
              ))}
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Aun no hay ventas fisicas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
