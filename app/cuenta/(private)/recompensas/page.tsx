import {
  CheckCircleIcon,
  GiftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { RedeemButton } from "components/customer/submit-button";
import { getCustomerRewards } from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";
import { requestRewardAction } from "../../actions";

const numberFormatter = new Intl.NumberFormat("es-CL");
const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const metadata = {
  title: "Recompensas",
  robots: { index: false, follow: false },
};

export default async function CustomerRewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { customer } = await requireCustomerAccount();
  const rewards = await getCustomerRewards();
  const params = await searchParams;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-olffy-purple">
        Usa tus puntos
      </p>
      <h1 className="mt-2 font-brand text-4xl font-black text-olffy-ink">
        Recompensas
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-olffy-muted">
        Tienes{" "}
        <strong className="text-olffy-purple">
          {numberFormatter.format(customer.points_balance)} puntos
        </strong>
        . Al solicitar un beneficio, el equipo OLFFY revisara el canje y te
        mostrara el codigo cuando sea aprobado.
      </p>

      {params.error ? (
        <div className="mt-6 rounded-[8px] border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {params.error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => {
          const affordable = reward.points_cost <= customer.points_balance;
          const canRedeem = affordable && customer.status === "active";

          return (
            <article
              key={reward.id}
              className="flex flex-col rounded-[8px] border-2 border-olffy-ink bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-olffy-cream">
                  <GiftIcon className="h-6 w-6 text-olffy-purple" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    affordable
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {affordable ? "Disponible" : "Aun no disponible"}
                </span>
              </div>
              <h2 className="mt-5 font-brand text-2xl font-black text-olffy-ink">
                {reward.name}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-olffy-muted">
                {reward.description ||
                  "Un beneficio especial para tu proxima compra."}
              </p>
              <p className="mt-5 text-3xl font-black text-olffy-purple">
                {numberFormatter.format(reward.points_cost)} pts
              </p>
              <div className="mt-4 space-y-2 border-t border-olffy-ink/15 pt-4 text-xs text-olffy-muted">
                {reward.discount_amount_clp ? (
                  <p>
                    Beneficio:{" "}
                    <strong>
                      {currencyFormatter.format(reward.discount_amount_clp)} de
                      descuento
                    </strong>
                  </p>
                ) : null}
                <p>
                  Compra minima:{" "}
                  <strong>
                    {currencyFormatter.format(reward.minimum_purchase_clp)}
                  </strong>
                </p>
                <p>
                  Vigencia al aprobarse:{" "}
                  <strong>{reward.validity_days} dias</strong>
                </p>
              </div>
              <form action={requestRewardAction}>
                <input type="hidden" name="rewardId" value={reward.id} />
                <input
                  type="hidden"
                  name="requestId"
                  value={crypto.randomUUID()}
                />
                <RedeemButton disabled={!canRedeem} />
              </form>
              {!affordable ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-olffy-muted">
                  <LockClosedIcon className="h-4 w-4" />
                  Te faltan{" "}
                  {numberFormatter.format(
                    reward.points_cost - customer.points_balance,
                  )}{" "}
                  pts
                </p>
              ) : canRedeem ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-green-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Tienes puntos suficientes
                </p>
              ) : (
                <p className="mt-3 text-center text-xs font-bold text-amber-700">
                  Canjes pausados por estado de cuenta
                </p>
              )}
            </article>
          );
        })}
      </div>

      {rewards.length === 0 ? (
        <div className="mt-8 rounded-[8px] border-2 border-dashed border-olffy-ink/25 bg-white p-8 text-center text-sm text-olffy-muted">
          No hay recompensas activas por ahora. Vuelve pronto.
        </div>
      ) : null}
    </div>
  );
}
