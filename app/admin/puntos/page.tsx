import { getLoyaltyStats, type LoyaltyStats } from "lib/loyalty/service";
import { connection } from "next/server";

const numberFormatter = new Intl.NumberFormat("es-CL");
const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
  accent?: string;
};

function SummaryCard({
  label,
  value,
  detail,
  accent = "text-olffy-ink",
}: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-2 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

export default async function AdminPointsPage() {
  await connection();

  let stats: LoyaltyStats | null = null;
  let error: string | null = null;

  try {
    stats = await getLoyaltyStats();
  } catch (cause) {
    console.error("Error loading loyalty stats:", cause);
    const message = cause instanceof Error ? cause.message : "";

    if (
      message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      message.includes("SUPABASE_SERVICE_ROLE_KEY")
    ) {
      error =
        "Falta configurar la conexion privada con Supabase en las variables de entorno.";
    } else {
      error =
        "No fue posible cargar OLFFY Puntos. Revisa que la migracion de Supabase este aplicada.";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
          OLFFY Puntos
        </p>
        <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
          Resumen de fidelizacion
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Supabase mantiene clientes, saldos y movimientos. Shopify continua
          como fuente de inventario y TUU registra las ventas fisicas.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Clientes"
              value={numberFormatter.format(stats.customersCount)}
              detail={`${numberFormatter.format(stats.activeCustomersCount)} activos`}
            />
            <SummaryCard
              label="Puntos vigentes"
              value={numberFormatter.format(stats.outstandingPoints)}
              detail={`${numberFormatter.format(stats.lifetimePointsEarned)} puntos historicos entregados`}
              accent="text-olffy-purple"
            />
            <SummaryCard
              label="Ventas fisicas TUU"
              value={numberFormatter.format(stats.physicalSalesCount)}
              detail="Ventas registradas fuera de Shopify"
              accent="text-olffy-orange"
            />
            <SummaryCard
              label="Total ventas fisicas"
              value={currencyFormatter.format(stats.physicalSalesTotal)}
              detail="Montos registrados en CLP"
              accent="text-green-700"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <SummaryCard
              label="Puntos canjeados"
              value={numberFormatter.format(stats.lifetimePointsRedeemed)}
              detail="Acumulado historico"
            />
            <SummaryCard
              label="Recompensas activas"
              value={numberFormatter.format(stats.activeRewardsCount)}
              detail="Disponibles para futuros canjes"
            />
            <SummaryCard
              label="Canjes"
              value={numberFormatter.format(stats.redemptionsCount)}
              detail="Solicitados, aprobados o entregados"
            />
          </div>
        </>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Base operativa</h2>
        <div className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-3">
          <div>
            <p className="font-medium text-gray-900">Inventario</p>
            <p className="mt-1">
              Se consulta y administra exclusivamente en Shopify.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Puntos</p>
            <p className="mt-1">
              El saldo y su libro de movimientos viven en Supabase.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Email marketing</p>
            <p className="mt-1">
              Solo se registran eventos futuros; esta etapa no envia correos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
