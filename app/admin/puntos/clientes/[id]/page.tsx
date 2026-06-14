import {
  getCustomerRedemptions,
  getCustomerTransactions,
  getLoyaltyCustomer,
  listRewards,
} from "lib/loyalty/service";
import {
  adjustPointsAction,
  cancelRedemptionAction,
  redeemRewardAction,
  reverseTransactionAction,
  updateRedemptionStatusAction,
} from "../../actions";
import { connection } from "next/server";

const numberFormatter = new Intl.NumberFormat("es-CL");
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const transactionLabels = {
  earned: "Acumulacion",
  redeemed: "Canje",
  adjusted: "Ajuste",
  expired: "Vencimiento",
  reversed: "Reversa",
};

export default async function LoyaltyCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const { id } = await params;
  const messages = await searchParams;
  const customerId = Number(id);
  const [customer, transactions, rewards, redemptions] = await Promise.all([
    getLoyaltyCustomer(customerId),
    getCustomerTransactions(customerId),
    listRewards(true),
    getCustomerRedemptions(customerId),
  ]);
  const availableRewards = rewards.filter(
    (reward) => reward.points_cost <= customer.points_balance,
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-olffy-purple">
          Cliente de puntos
        </p>
        <h1 className="mt-1 font-brand text-3xl font-black text-olffy-ink">
          {customer.full_name || customer.email}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {customer.email}
          {customer.phone ? ` · ${customer.phone}` : ""}
        </p>
      </div>

      {messages.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {messages.error}
        </div>
      ) : null}
      {messages.created ||
      messages.adjusted ||
      messages.reversed ||
      messages.redeemed ||
      messages.redemptionUpdated ||
      messages.redemptionCancelled ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Operacion registrada correctamente.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Saldo disponible" value={customer.points_balance} />
        <Metric
          label="Puntos acumulados"
          value={customer.lifetime_points_earned}
        />
        <Metric
          label="Puntos usados"
          value={customer.lifetime_points_redeemed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          action={adjustPointsAction}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="customerId" value={customer.id} />
          <div>
            <h2 className="font-semibold text-gray-900">Ajuste manual</h2>
            <p className="mt-1 text-xs text-gray-500">
              Usa valores positivos para sumar y negativos para descontar.
            </p>
          </div>
          <input
            required
            type="number"
            name="points"
            placeholder="Puntos"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            name="reason"
            placeholder="Motivo obligatorio"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            required
            name="createdBy"
            placeholder="Responsable"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="externalReference"
            placeholder="Comprobante o referencia (opcional)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-olffy-ink px-4 py-2 text-sm font-semibold text-white">
            Registrar ajuste
          </button>
        </form>

        <form
          action={redeemRewardAction}
          className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="customerId" value={customer.id} />
          <div>
            <h2 className="font-semibold text-gray-900">Crear canje</h2>
            <p className="mt-1 text-xs text-gray-500">
              Reserva los puntos. El descuento Shopify se crea cuando un
              administrador aprueba el canje.
            </p>
          </div>
          <select
            required
            name="rewardId"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Seleccionar recompensa
            </option>
            {availableRewards.map((reward) => (
              <option key={reward.id} value={reward.id}>
                {reward.name} · {numberFormatter.format(reward.points_cost)} pts
              </option>
            ))}
          </select>
          <input
            required
            name="createdBy"
            placeholder="Responsable"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            disabled={availableRewards.length === 0}
            className="rounded-md bg-olffy-purple px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Registrar canje
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Canjes</h2>
        <div className="grid gap-4">
          {redemptions.map((redemption) => {
            const isExpired =
              redemption.status === "approved" &&
              Boolean(redemption.shopify_discount_ends_at) &&
              new Date(redemption.shopify_discount_ends_at!).getTime() <=
                Date.now();

            return (
              <div
                key={redemption.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {redemption.rewards?.name || "Recompensa"}
                    </p>
                    {redemption.shopify_discount_code ? (
                      <p className="mt-1 font-mono text-sm text-olffy-purple">
                        {redemption.shopify_discount_code}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-gray-500">
                      {numberFormatter.format(redemption.points_spent)} pts ·{" "}
                      {redemption.shopify_discount_ends_at
                        ? `vence ${dateFormatter.format(new Date(redemption.shopify_discount_ends_at))}`
                        : "sin vencimiento"}
                    </p>
                    {redemption.shopify_discount_last_error ? (
                      <p className="mt-2 text-xs text-red-700">
                        Shopify: {redemption.shopify_discount_last_error}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {redemption.status}
                  </span>
                </div>

                {redemption.status === "requested" ||
                redemption.status === "approved" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {!isExpired ? (
                      <form
                        action={updateRedemptionStatusAction}
                        className="flex flex-wrap gap-2"
                      >
                        <input
                          type="hidden"
                          name="customerId"
                          value={customer.id}
                        />
                        <input
                          type="hidden"
                          name="redemptionId"
                          value={redemption.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value={
                            redemption.status === "requested"
                              ? "approved"
                              : "fulfilled"
                          }
                        />
                        <input
                          required
                          name="createdBy"
                          placeholder="Responsable"
                          className="min-w-40 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold">
                          {redemption.status === "requested"
                            ? "Aprobar y crear descuento"
                            : "Verificar uso en Shopify"}
                        </button>
                      </form>
                    ) : (
                      <div className="text-sm text-gray-600">
                        El descuento vencio. Procesa el vencimiento para
                        comprobar uso y devolver puntos cuando corresponda.
                      </div>
                    )}
                    <form
                      action={cancelRedemptionAction}
                      className="flex flex-wrap gap-2"
                    >
                      <input
                        type="hidden"
                        name="customerId"
                        value={customer.id}
                      />
                      <input
                        type="hidden"
                        name="redemptionId"
                        value={redemption.id}
                      />
                      <input
                        required
                        name="reason"
                        defaultValue={isExpired ? "Vencimiento sin uso" : ""}
                        placeholder={
                          isExpired
                            ? "Motivo de vencimiento"
                            : "Motivo de cancelacion"
                        }
                        className="min-w-40 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        required
                        name="createdBy"
                        placeholder="Responsable"
                        className="min-w-32 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      {isExpired ? (
                        <input type="hidden" name="expired" value="1" />
                      ) : null}
                      <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                        {isExpired ? "Procesar vencimiento" : "Cancelar"}
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
          {redemptions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              Este cliente aun no tiene canjes.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Historial de puntos
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Movimiento</th>
                <th className="px-4 py-3 font-semibold">Puntos</th>
                <th className="px-4 py-3 font-semibold">Saldo</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-4 text-gray-500">
                    {dateFormatter.format(new Date(transaction.created_at))}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {transactionLabels[transaction.transaction_type]}
                  </td>
                  <td
                    className={`px-4 py-4 font-semibold ${
                      transaction.points > 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {transaction.points > 0 ? "+" : ""}
                    {numberFormatter.format(transaction.points)}
                  </td>
                  <td className="px-4 py-4">
                    {numberFormatter.format(transaction.balance_after)}
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    <p>{transaction.description || transaction.source}</p>
                    {transaction.transaction_type !== "reversed" ? (
                      <form
                        action={reverseTransactionAction}
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        <input
                          type="hidden"
                          name="customerId"
                          value={customer.id}
                        />
                        <input
                          type="hidden"
                          name="transactionId"
                          value={transaction.id}
                        />
                        <input
                          required
                          name="reason"
                          placeholder="Motivo"
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <input
                          required
                          name="createdBy"
                          placeholder="Responsable"
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                        <button className="text-xs font-semibold text-red-700">
                          Reversar
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-olffy-purple">
        {numberFormatter.format(value)}
      </p>
    </div>
  );
}
