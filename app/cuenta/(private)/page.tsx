import { getCustomerOverview, getCustomerTransactions } from "lib/customer/account";
import { requireCustomerAccount } from "lib/customer/auth";
import { getCustomerOrders } from "lib/customer/orders";
import type { PuntosTab } from "src/olffy/components/puntos";
import {
  toPuntosCustomer,
  toPuntosRedemptions,
  toPuntosRewards,
  toPuntosRuleInfo,
  toPuntosRules,
  toPuntosTransactions,
} from "src/olffy/integration/account-mappers";
import { PuntosPanelClient } from "src/olffy/integration/PuntosPanelClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

const VALID_TABS: PuntosTab[] = [
  "resumen",
  "historial",
  "recompensas",
  "canjes",
  "reglas",
  "configuracion",
];

export default async function CustomerAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ customer }, params] = await Promise.all([
    requireCustomerAccount(),
    searchParams,
  ]);

  const [overview, transactions, orders] = await Promise.all([
    getCustomerOverview(customer),
    getCustomerTransactions(customer.id, 50),
    getCustomerOrders(customer.id),
  ]);

  const initialTab = VALID_TABS.includes(params.tab as PuntosTab)
    ? (params.tab as PuntosTab)
    : undefined;

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
    <OlffyStorefront>
      <PuntosPanelClient
        customer={toPuntosCustomer(customer)}
        transactions={toPuntosTransactions(transactions)}
        orders={orders}
        rewards={toPuntosRewards(overview.rewards)}
        redemptions={toPuntosRedemptions(overview.redemptions)}
        rules={toPuntosRules(overview.rule)}
        ruleInfo={toPuntosRuleInfo(overview.rule)}
        expiringNotice={expiringNotice}
        {...(initialTab ? { initialTab } : {})}
      />
    </OlffyStorefront>
  );
}
