import { getCustomerAccountState } from "lib/customer/auth";
import { getCustomerRewards } from "lib/customer/account";
import { Suspense } from "react";
import { CheckoutPageClient } from "src/olffy/integration/CheckoutPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";
import type { CheckoutLoyaltyData } from "src/olffy/types";

export const metadata = {
  title: "Checkout",
};

// El shell pinta de inmediato; solo el contenido del checkout espera la
// verificación de sesión (email del cliente para OLFFY Puntos).
export default function CheckoutPage() {
  return (
    <OlffyStorefront>
      <Suspense fallback={null}>
        <CheckoutPageContent />
      </Suspense>
    </OlffyStorefront>
  );
}

async function CheckoutPageContent() {
  let customerEmail: string | undefined;
  let loyalty: CheckoutLoyaltyData = {
    signedIn: false,
    pointsBalance: 0,
    rewards: [],
  };

  try {
    const account = await getCustomerAccountState();
    if (account.status === "ready") {
      customerEmail = account.customer.email;
      const rewards = await getCustomerRewards();
      loyalty = {
        signedIn: true,
        customerName:
          account.customer.full_name ?? account.customer.email.split("@")[0],
        pointsBalance: account.customer.points_balance,
        rewards: rewards
          .filter(
            (reward) =>
              reward.reward_type === "discount" &&
              Number(reward.discount_amount_clp) > 0,
          )
          .map((reward) => ({
            id: reward.id,
            name: reward.name,
            description: reward.description,
            pointsCost: reward.points_cost,
            discountAmountClp: Number(reward.discount_amount_clp),
            minimumPurchaseClp: reward.minimum_purchase_clp,
          })),
      };
    }
  } catch {
    // sin sesión de cliente: checkout como invitado
  }

  return <CheckoutPageClient customerEmail={customerEmail} loyalty={loyalty} />;
}
