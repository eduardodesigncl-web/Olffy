import { getCustomerOverview } from "lib/customer/account";
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
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function CustomerAccountPage() {
  const { customer } = await requireCustomerAccount();
  const overview = await getCustomerOverview(customer);
  const transactions = toFrontendTransactions(overview.transactions);
  const redemptions = toFrontendRedemptions(overview.redemptions);

  const expiringNotice = overview.expiringPoints
    ? {
        points: overview.expiringPoints.expiringPoints,
        dateLabel: overview.expiringPoints.nextExpiry
          ? new Intl.DateTimeFormat("es-CL", {
              dateStyle: "long",
              timeZone: "America/Santiago",
            }).format(new Date(overview.expiringPoints.nextExpiry))
          : null,
      }
    : null;

  return (
    <OlffyShell>
      <AccountPageClient
        screen="dashboard"
        customer={toFrontendCustomer(customer, {
          ordersCount: transactions.length,
          redemptionsCount: redemptions.length,
        })}
        transactions={transactions}
        rewards={toFrontendRewards(overview.rewards)}
        redemptions={redemptions}
        expiringNotice={expiringNotice}
      />
    </OlffyShell>
  );
}
