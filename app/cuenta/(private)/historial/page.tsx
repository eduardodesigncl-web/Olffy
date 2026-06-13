import { TransactionList } from "components/customer/transaction-list";
import { getCustomerTransactions } from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";

export const metadata = {
  title: "Historial de puntos",
  robots: { index: false, follow: false },
};

export default async function CustomerHistoryPage() {
  const { customer } = await requireCustomerAccount();
  const transactions = await getCustomerTransactions(customer.id);

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-olffy-purple">
        Tus puntos
      </p>
      <h1 className="mt-2 font-brand text-4xl font-black text-olffy-ink">
        Historial completo
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-olffy-muted">
        Aqui aparecen compras, canjes, ajustes, vencimientos y reversas. Los
        movimientos no se borran, para que siempre puedas entender tu saldo.
      </p>
      <div className="mt-8">
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
