import Link from "next/link";
import { requireAdminSession } from "lib/admin/auth";
import {
  getDigitalSalePaymentLabel,
  getDigitalSalesDashboard,
} from "lib/admin/digital-sales";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
});
const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("es-CL");

const statusTone: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  processed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  issued: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  skipped: "bg-gray-50 text-gray-700 ring-gray-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  manual_review: "bg-red-50 text-red-700 ring-red-200",
};

function statusBadge(value: string) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ring-1 ${
        statusTone[value] ?? "bg-gray-50 text-gray-700 ring-gray-200"
      }`}
    >
      {value.replace("_", " ")}
    </span>
  );
}

function metadataText(
  metadata: Record<string, unknown>,
  key: string,
  fallback = "-",
) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function DigitalSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const dashboard = await getDigitalSalesDashboard({ page: params.page });
  const cards = [
    {
      label: "Ventas digitales hoy",
      value: numberFormatter.format(dashboard.summary.salesToday),
    },
    {
      label: "Total vendido online",
      value: moneyFormatter.format(dashboard.summary.totalSold),
    },
    {
      label: "Ordenes pagadas",
      value: numberFormatter.format(dashboard.summary.paidOrders),
    },
    {
      label: "Pagos Mercado Pago",
      value: numberFormatter.format(dashboard.summary.mercadoPagoOrders),
    },
    {
      label: "Pagos Checkout Flow",
      value: numberFormatter.format(dashboard.summary.checkoutFlowOrders),
    },
    {
      label: "Clientes identificados",
      value: numberFormatter.format(dashboard.summary.identifiedCustomers),
    },
    {
      label: "Puntos generados",
      value: numberFormatter.format(dashboard.summary.pointsGenerated),
    },
    {
      label: "Errores pendientes",
      value: numberFormatter.format(dashboard.summary.pendingErrors),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-olffy-ink">Ventas digitales</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ordenes online pagadas desde Shopify, resumidas en Supabase para
          operacion, puntos, boleta y marketing.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase text-gray-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-black text-olffy-ink">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Metodo de pago</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Boleta</th>
              <th className="px-4 py-3">Marketing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dashboard.sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/ventas-digitales/${sale.id}`}
                    className="font-semibold text-olffy-purple"
                  >
                    {sale.shopify_order_name ?? sale.olffy_reference}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {sale.olffy_reference}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {metadataText(sale.metadata, "customer_name")}
                </td>
                <td className="px-4 py-3">{sale.customer_email ?? "-"}</td>
                <td className="px-4 py-3">
                  {dateFormatter.format(new Date(sale.created_at))}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {moneyFormatter.format(sale.total)}
                </td>
                <td className="px-4 py-3">
                  {getDigitalSalePaymentLabel(sale)}
                </td>
                <td className="px-4 py-3">
                  {statusBadge(sale.payment_status)}
                </td>
                <td className="px-4 py-3">{sale.sale_channel_detail}</td>
                <td className="px-4 py-3">
                  {numberFormatter.format(sale.points_earned)}
                </td>
                <td className="px-4 py-3">{statusBadge(sale.tax_status)}</td>
                <td className="px-4 py-3">
                  {statusBadge(sale.marketing_status)}
                </td>
              </tr>
            ))}
            {dashboard.sales.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Aun no hay ventas digitales registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Pagina {dashboard.page} de {dashboard.totalPages} -{" "}
          {numberFormatter.format(dashboard.totalRows)} ventas
        </span>
        <div className="flex gap-2">
          <Link
            href={`/admin/ventas-digitales?page=${Math.max(dashboard.page - 1, 1)}`}
            aria-disabled={dashboard.page <= 1}
            className={`rounded-md border px-3 py-2 font-semibold ${
              dashboard.page <= 1
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Anterior
          </Link>
          <Link
            href={`/admin/ventas-digitales?page=${Math.min(
              dashboard.page + 1,
              dashboard.totalPages,
            )}`}
            aria-disabled={dashboard.page >= dashboard.totalPages}
            className={`rounded-md border px-3 py-2 font-semibold ${
              dashboard.page >= dashboard.totalPages
                ? "pointer-events-none border-gray-200 text-gray-300"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Siguiente
          </Link>
        </div>
      </div>
    </div>
  );
}
