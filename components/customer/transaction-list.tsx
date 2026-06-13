import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  ArrowUpCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import type { CustomerTransaction } from "lib/customer/account";

const numberFormatter = new Intl.NumberFormat("es-CL");
const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
});

const labels: Record<CustomerTransaction["transaction_type"], string> = {
  earned: "Puntos acumulados",
  redeemed: "Canje solicitado",
  adjusted: "Ajuste de puntos",
  expired: "Puntos vencidos",
  reversed: "Movimiento reversado",
};

const sourceLabels: Record<CustomerTransaction["source"], string> = {
  physical_sale: "Compra en tienda",
  shopify_order: "Compra online",
  reward_redemption: "Recompensa",
  manual: "Ajuste OLFFY",
  system: "Sistema",
};

function TransactionIcon({
  transaction,
}: {
  transaction: CustomerTransaction;
}) {
  if (transaction.transaction_type === "reversed") {
    return <ArrowPathIcon className="h-5 w-5" />;
  }
  if (transaction.points > 0) {
    return <ArrowUpCircleIcon className="h-5 w-5" />;
  }
  if (transaction.points < 0) {
    return <ArrowDownCircleIcon className="h-5 w-5" />;
  }
  return <MinusCircleIcon className="h-5 w-5" />;
}

export function TransactionList({
  transactions,
  emptyText = "Aun no tienes movimientos de puntos.",
}: {
  transactions: CustomerTransaction[];
  emptyText?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-[8px] border-2 border-dashed border-olffy-ink/25 bg-white p-8 text-center text-sm text-olffy-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-white">
      {transactions.map((transaction) => (
        <article
          key={transaction.id}
          className="flex flex-col gap-4 border-b border-olffy-ink/15 p-5 last:border-b-0 sm:flex-row sm:items-center"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              transaction.points > 0
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-olffy-orange"
            }`}
          >
            <TransactionIcon transaction={transaction} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-bold text-olffy-ink">
                {labels[transaction.transaction_type]}
              </h3>
              <span className="rounded-full bg-olffy-cream px-2 py-1 text-xs font-bold text-olffy-muted">
                {sourceLabels[transaction.source]}
              </span>
            </div>
            <p className="mt-1 text-sm text-olffy-muted">
              {transaction.description || sourceLabels[transaction.source]}
            </p>
            <p className="mt-1 text-xs text-olffy-muted">
              {dateFormatter.format(new Date(transaction.created_at))}
            </p>
          </div>
          <div className="sm:text-right">
            <p
              className={`text-xl font-black ${
                transaction.points > 0 ? "text-green-700" : "text-olffy-orange"
              }`}
            >
              {transaction.points > 0 ? "+" : ""}
              {numberFormatter.format(transaction.points)} pts
            </p>
            <p className="mt-1 text-xs text-olffy-muted">
              Saldo: {numberFormatter.format(transaction.balance_after)} pts
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
