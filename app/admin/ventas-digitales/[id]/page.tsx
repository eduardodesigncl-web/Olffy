import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "lib/admin/auth";
import {
  getDigitalSaleById,
  getDigitalSalePaymentLabel,
} from "lib/admin/digital-sales";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeStyle: "short",
});
const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("es-CL");

function metadataText(
  metadata: Record<string, unknown>,
  key: string,
  fallback = "-",
) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default async function DigitalSaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  let sale;

  try {
    sale = await getDigitalSaleById(id);
  } catch {
    notFound();
  }

  const gateways = sale.metadata.payment_gateway_names;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/ventas-digitales"
            className="text-sm font-semibold text-olffy-purple"
          >
            Volver a ventas digitales
          </Link>
          <h1 className="mt-2 text-2xl font-black text-olffy-ink">
            {sale.shopify_order_name ?? sale.olffy_reference}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Venta online pagada, registrada como snapshot operativo en Supabase.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <p className="text-2xl font-black text-olffy-ink">
            {moneyFormatter.format(sale.total)}
          </p>
        </div>
      </div>

      {sale.last_error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Error pendiente</p>
          <p className="mt-1">{sale.last_error}</p>
        </div>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Referencia OLFFY" value={sale.olffy_reference} />
        <DetailItem
          label="Orden Shopify"
          value={sale.shopify_order_id ?? "-"}
        />
        <DetailItem
          label="Fecha"
          value={dateFormatter.format(new Date(sale.created_at))}
        />
        <DetailItem
          label="Metodo de pago"
          value={getDigitalSalePaymentLabel(sale)}
        />
        <DetailItem label="Estado de pago" value={sale.payment_status} />
        <DetailItem label="Canal" value={sale.sale_channel_detail} />
        <DetailItem
          label="Cliente"
          value={metadataText(sale.metadata, "customer_name")}
        />
        <DetailItem label="Email" value={sale.customer_email ?? "-"} />
        <DetailItem
          label="Cliente puntos"
          value={sale.loyalty_customer_id ?? "-"}
        />
        <DetailItem label="Boleta" value={sale.tax_status} />
        <DetailItem label="Puntos" value={sale.loyalty_status} />
        <DetailItem label="Marketing" value={sale.marketing_status} />
      </section>

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem
          label="Subtotal"
          value={moneyFormatter.format(Number(sale.metadata.subtotal ?? 0))}
        />
        <DetailItem
          label="Descuento"
          value={moneyFormatter.format(Number(sale.metadata.discount ?? 0))}
        />
        <DetailItem
          label="Puntos generados"
          value={numberFormatter.format(sale.points_earned)}
        />
        <DetailItem
          label="Items resumidos"
          value={Number(sale.metadata.line_items_count ?? 0)}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black uppercase text-gray-500">
          Snapshot operativo
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Fuente"
            value={metadataText(sale.metadata, "source")}
          />
          <DetailItem
            label="Idempotencia"
            value={
              sale.idempotency_key ??
              metadataText(sale.metadata, "idempotency_key")
            }
          />
          <DetailItem
            label="Gateways Shopify"
            value={Array.isArray(gateways) ? gateways.join(", ") : "-"}
          />
          <DetailItem
            label="Procesada en Shopify"
            value={metadataText(sale.metadata, "shopify_processed_at")}
          />
        </dl>
      </section>
    </div>
  );
}
