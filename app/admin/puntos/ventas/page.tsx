import {
  getActiveLoyaltyRule,
  listPhysicalSales,
  searchLoyaltyCustomers,
} from "lib/loyalty/service";
import { LoyaltyPos } from "components/admin/loyalty-pos";
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

export default async function PhysicalSalesPage() {
  await connection();
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
          POS de ventas fisicas TUU
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Shopify valida productos, precios, stock y crea la orden pagada.
          Supabase registra la venta, puntos y auditoria. La regla activa
          entrega {rule.points_per_unit} puntos por cada{" "}
          {currencyFormatter.format(rule.spending_unit_clp)}.
        </p>
      </div>

      <LoyaltyPos customers={customers} rule={rule} />

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-gray-900">Ventas recientes</h2>
          <p className="text-xs text-gray-500">
            Historial operativo registrado en Supabase.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Referencia</th>
                <th className="px-4 py-3 font-semibold">Orden Shopify</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Puntos +/-</th>
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
                  <td className="px-4 py-4 font-mono text-xs text-gray-600">
                    {sale.shopify_order_name || sale.shopify_order_id || "-"}
                  </td>
                  <td className="px-4 py-4 font-semibold">
                    {currencyFormatter.format(sale.total)}
                  </td>
                  <td className="px-4 py-4 text-olffy-purple">
                    +{sale.points_earned} / -{sale.points_spent}
                  </td>
                </tr>
              ))}
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    Aun no hay ventas fisicas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
