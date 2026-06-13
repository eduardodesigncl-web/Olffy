import {
  ArrowRightIcon,
  CheckBadgeIcon,
  GiftIcon,
  SparklesIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { TransactionList } from "components/customer/transaction-list";
import { getCustomerOverview } from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";
import Link from "next/link";

const numberFormatter = new Intl.NumberFormat("es-CL");

export const metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function CustomerAccountPage() {
  const { customer } = await requireCustomerAccount();
  const overview = await getCustomerOverview(customer);
  const pointsMissing = overview.nextReward
    ? overview.nextReward.points_cost - customer.points_balance
    : 0;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-olffy-purple text-white">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
              Hola, {customer.full_name?.split(" ")[0] || "creativa"}
            </p>
            <h1 className="mt-3 font-brand text-4xl font-black">
              Tienes {numberFormatter.format(customer.points_balance)} puntos
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-white/80">
              Cada compra asociada a tu cuenta queda registrada aqui. Tus puntos
              disponibles siempre coinciden con el historial.
            </p>
          </div>
          <Link
            href="/cuenta/recompensas"
            className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-olffy-yellow px-5 py-3 font-brand font-black text-olffy-ink"
          >
            Ver recompensas
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {customer.status === "blocked" ? (
        <div className="rounded-[8px] border-2 border-amber-400 bg-amber-50 p-5 text-sm text-amber-900">
          Tu cuenta esta temporalmente bloqueada. Puedes revisar todos tus
          datos, pero los canjes estan pausados. Contacta a OLFFY para recibir
          ayuda.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saldo disponible"
          value={`${numberFormatter.format(customer.points_balance)} pts`}
          detail="Listos para usar"
          icon={SparklesIcon}
          color="bg-olffy-yellow"
        />
        <MetricCard
          label="Puntos acumulados"
          value={numberFormatter.format(customer.lifetime_points_earned)}
          detail="Desde tu inscripcion"
          icon={CheckBadgeIcon}
          color="bg-green-200"
        />
        <MetricCard
          label="Proxima recompensa"
          value={
            overview.nextReward
              ? `Faltan ${numberFormatter.format(pointsMissing)}`
              : "Ya disponibles"
          }
          detail={overview.nextReward?.name || "Revisa el catalogo"}
          icon={GiftIcon}
          color="bg-purple-200"
        />
        <MetricCard
          label="Canjes en curso"
          value={numberFormatter.format(overview.pendingRedemptions.length)}
          detail="Solicitados o aprobados"
          icon={TicketIcon}
          color="bg-orange-200"
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-olffy-purple">
              Tus puntos
            </p>
            <h2 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
              Ultimos movimientos
            </h2>
          </div>
          <Link
            href="/cuenta/historial"
            className="text-sm font-bold text-olffy-purple hover:text-olffy-orange"
          >
            Ver historial completo
          </Link>
        </div>
        <TransactionList transactions={overview.transactions} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[8px] border-2 border-olffy-ink bg-white p-6">
          <h2 className="font-brand text-2xl font-black text-olffy-ink">
            Como ganas puntos
          </h2>
          <p className="mt-3 text-sm leading-6 text-olffy-muted">
            Recibes {numberFormatter.format(overview.rule.points_per_unit)}{" "}
            puntos por cada{" "}
            {new Intl.NumberFormat("es-CL", {
              style: "currency",
              currency: "CLP",
              maximumFractionDigits: 0,
            }).format(overview.rule.spending_unit_clp)}{" "}
            pagados en compras asociadas a tu cuenta.
          </p>
        </div>
        <div className="rounded-[8px] border-2 border-olffy-ink bg-olffy-cream p-6">
          <h2 className="font-brand text-2xl font-black text-olffy-ink">
            Tu perfil
          </h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-olffy-muted">Correo</dt>
              <dd className="text-right font-bold">{customer.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-olffy-muted">Telefono</dt>
              <dd className="text-right font-bold">
                {customer.phone || "No registrado"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-olffy-muted">Estado</dt>
              <dd className="text-right font-bold">
                {customer.status === "active" ? "Activa" : "Bloqueada"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof SparklesIcon;
  color: string;
}) {
  return (
    <article className="rounded-[8px] border-2 border-olffy-ink bg-white p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}
      >
        <Icon className="h-5 w-5 text-olffy-ink" />
      </div>
      <p className="mt-5 text-sm font-bold text-olffy-muted">{label}</p>
      <p className="mt-1 font-brand text-2xl font-black text-olffy-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-olffy-muted">{detail}</p>
    </article>
  );
}
