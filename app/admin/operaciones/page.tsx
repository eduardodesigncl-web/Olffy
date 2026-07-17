import { requireAdminPagePermission } from "lib/admin/auth";
import { listOrderReferences } from "lib/transactions/repository";
import { retryBoletaAction } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});
const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default async function OperationsPage() {
  await requireAdminPagePermission("ventas");
  const operations = await listOrderReferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-olffy-ink">
          Operaciones de venta
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Estado unificado de pago, Shopify, boleta, puntos y marketing.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Operacion</th>
              <th className="px-4 py-3">Orden</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Boleta</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Marketing</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operations.map((operation) => (
              <tr key={operation.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">
                    {operation.olffy_reference}
                  </p>
                  <p className="text-xs text-gray-500">
                    {operation.channel} ·{" "}
                    {dateFormatter.format(new Date(operation.created_at))}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {operation.shopify_order_name ?? "Pendiente"}
                </td>
                <td className="px-4 py-3">
                  {moneyFormatter.format(operation.total)}
                </td>
                <td className="px-4 py-3">{operation.payment_status}</td>
                <td className="px-4 py-3">{operation.tax_status}</td>
                <td className="px-4 py-3">{operation.loyalty_status}</td>
                <td className="px-4 py-3">{operation.marketing_status}</td>
                <td className="px-4 py-3">
                  {["rejected", "manual_review", "pending"].includes(
                    operation.tax_status,
                  ) && operation.shopify_order_id ? (
                    <form action={retryBoletaAction}>
                      <input
                        type="hidden"
                        name="orderRefId"
                        value={operation.id}
                      />
                      <button className="font-semibold text-olffy-purple">
                        Reintentar boleta
                      </button>
                    </form>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {operations.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Aun no hay operaciones registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
