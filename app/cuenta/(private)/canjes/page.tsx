import {
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { getCustomerRedemptions } from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";

const numberFormatter = new Intl.NumberFormat("es-CL");
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusData = {
  requested: {
    label: "Solicitado",
    detail: "El equipo OLFFY revisara tu solicitud.",
    color: "bg-amber-100 text-amber-800",
    icon: ClockIcon,
  },
  creating: {
    label: "Creando descuento",
    detail: "Shopify esta procesando tu beneficio.",
    color: "bg-amber-100 text-amber-800",
    icon: ClockIcon,
  },
  approved: {
    label: "Aprobado",
    detail: "Tu beneficio esta listo para usar.",
    color: "bg-purple-100 text-olffy-purple",
    icon: CheckCircleIcon,
  },
  fulfilled: {
    label: "Entregado",
    detail: "Este beneficio ya fue utilizado.",
    color: "bg-green-100 text-green-800",
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: "Cancelado",
    detail: "Los puntos fueron devueltos cuando correspondia.",
    color: "bg-red-100 text-red-800",
    icon: NoSymbolIcon,
  },
  cancelling: {
    label: "Cancelando",
    detail: "Estamos desactivando el descuento antes de devolver los puntos.",
    color: "bg-amber-100 text-amber-800",
    icon: ClockIcon,
  },
  expired: {
    label: "Vencido",
    detail: "El descuento vencio sin uso y los puntos fueron devueltos.",
    color: "bg-gray-100 text-gray-700",
    icon: NoSymbolIcon,
  },
  reconciliation_required: {
    label: "En revision",
    detail: "El equipo OLFFY esta conciliando este beneficio con Shopify.",
    color: "bg-amber-100 text-amber-800",
    icon: ClockIcon,
  },
  expired_pending: {
    label: "Vencido",
    detail: "El descuento ya no puede usarse y espera conciliacion de puntos.",
    color: "bg-gray-100 text-gray-700",
    icon: NoSymbolIcon,
  },
};

export const metadata = {
  title: "Mis canjes",
  robots: { index: false, follow: false },
};

export default async function CustomerRedemptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const { customer } = await requireCustomerAccount();
  const redemptions = await getCustomerRedemptions(customer.id);
  const params = await searchParams;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-olffy-purple">
        Seguimiento
      </p>
      <h1 className="mt-2 font-brand text-4xl font-black text-olffy-ink">
        Mis canjes
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-olffy-muted">
        Revisa si tu solicitud esta pendiente, aprobada, entregada o cancelada.
        Los codigos aparecen cuando el equipo aprueba el beneficio.
      </p>

      {params.requested ? (
        <div className="mt-6 rounded-[8px] border-2 border-green-600 bg-green-50 p-4 text-sm text-green-800">
          Solicitud enviada. Ya puedes seguir su estado en esta pagina.
        </div>
      ) : null}

      <div className="mt-8 grid gap-5">
        {redemptions.map((redemption) => {
          const isPastEnd =
            redemption.status === "approved" &&
            Boolean(redemption.shopify_discount_ends_at) &&
            new Date(redemption.shopify_discount_ends_at!).getTime() <=
              Date.now();
          const state =
            statusData[isPastEnd ? "expired_pending" : redemption.status];
          const Icon = state.icon;
          const showCode = redemption.status === "approved" && !isPastEnd;

          return (
            <article
              key={redemption.id}
              className="rounded-[8px] border-2 border-olffy-ink bg-white p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olffy-cream">
                  <TicketIcon className="h-6 w-6 text-olffy-purple" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-brand text-2xl font-black text-olffy-ink">
                        {redemption.rewards?.name || "Recompensa OLFFY"}
                      </h2>
                      <p className="mt-1 text-sm text-olffy-muted">
                        {numberFormatter.format(redemption.points_spent)} puntos
                        usados el{" "}
                        {dateFormatter.format(new Date(redemption.redeemed_at))}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${state.color}`}
                    >
                      <Icon className="h-4 w-4" />
                      {state.label}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-olffy-muted">
                    {state.detail}
                  </p>
                  {showCode && redemption.shopify_discount_code ? (
                    <div className="mt-5 rounded-[6px] border-2 border-dashed border-olffy-purple bg-purple-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-olffy-purple">
                        Codigo de canje
                      </p>
                      <p className="mt-2 font-mono text-xl font-black text-olffy-ink">
                        {redemption.shopify_discount_code}
                      </p>
                      {redemption.shopify_discount_ends_at ? (
                        <p className="mt-2 text-xs text-olffy-muted">
                          Vigente hasta{" "}
                          {dateFormatter.format(
                            new Date(redemption.shopify_discount_ends_at),
                          )}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {redemption.status === "cancelled" &&
                  redemption.cancellation_reason ? (
                    <p className="mt-4 text-sm text-red-700">
                      Motivo: {redemption.cancellation_reason}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {redemptions.length === 0 ? (
        <div className="mt-8 rounded-[8px] border-2 border-dashed border-olffy-ink/25 bg-white p-8 text-center">
          <TicketIcon className="mx-auto h-8 w-8 text-olffy-purple" />
          <p className="mt-3 font-bold text-olffy-ink">
            Aun no has solicitado canjes.
          </p>
          <p className="mt-1 text-sm text-olffy-muted">
            Cuando elijas una recompensa, aparecera aqui.
          </p>
        </div>
      ) : null}
    </div>
  );
}
