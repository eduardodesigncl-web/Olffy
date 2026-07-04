import {
  getCustomerRedemptions,
  getCustomerRewards,
  getCustomerTransactions,
} from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";
import { AccountPageClient } from "src/integration/AccountPageClient";
import { OlffyShell } from "src/integration/OlffyShell";
import {
  toFrontendCustomer,
  toFrontendRedemptions,
  toFrontendRewards,
  toFrontendTransactions,
} from "src/integration/mappers";

export const metadata = {
  title: "Recompensas",
  robots: { index: false, follow: false },
};

export default async function CustomerRewardsPage() {
  const { customer } = await requireCustomerAccount();
  const [transactionsRaw, rewardsRaw, redemptionsRaw] = await Promise.all([
    getCustomerTransactions(customer.id),
    getCustomerRewards(),
    getCustomerRedemptions(customer.id),
  ]);
  const transactions = toFrontendTransactions(transactionsRaw);
  const redemptions = toFrontendRedemptions(redemptionsRaw);

  return (
    <OlffyShell>
      <AccountPageClient
        screen="rewards"
        customer={toFrontendCustomer(customer, {
          ordersCount: transactions.length,
          redemptionsCount: redemptions.length,
        })}
        transactions={transactions}
        rewards={toFrontendRewards(rewardsRaw)}
        redemptions={redemptions}
      />
    </OlffyShell>
  );
}
