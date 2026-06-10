import { listRewards } from "lib/loyalty/service";
import { createRewardAction } from "../actions";
import { connection } from "next/server";

const numberFormatter = new Intl.NumberFormat("es-CL");
const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const rewards = await listRewards();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
          OLFFY Puntos
        </p>
        <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
          Recompensas
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Beneficios disponibles para canjes simples del MVP.
        </p>
      </div>

      {params.created ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Recompensa creada correctamente.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {rewards.map((reward) => (
            <article
              key={reward.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{reward.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {reward.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    reward.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {reward.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold text-olffy-purple">
                {numberFormatter.format(reward.points_cost)} pts
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {reward.discount_amount_clp
                  ? `${currencyFormatter.format(reward.discount_amount_clp)} de descuento`
                  : reward.reward_type}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Vigencia del codigo: {reward.validity_days} dias
              </p>
            </article>
          ))}
        </div>

        <form
          action={createRewardAction}
          className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">Nueva recompensa</h2>
          <input
            required
            name="name"
            placeholder="Nombre"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Descripcion"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            min="1"
            type="number"
            name="pointsCost"
            placeholder="Costo en puntos"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            min="1"
            type="number"
            name="discountAmountClp"
            placeholder="Descuento CLP"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            min="0"
            type="number"
            name="minimumPurchaseClp"
            placeholder="Compra minima CLP"
            defaultValue="0"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            min="1"
            type="number"
            name="validityDays"
            placeholder="Dias de vigencia"
            defaultValue="30"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="w-full rounded-md bg-olffy-purple px-4 py-2 text-sm font-semibold text-white">
            Crear recompensa
          </button>
        </form>
      </div>
    </div>
  );
}
