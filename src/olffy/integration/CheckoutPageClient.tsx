"use client";

import { useRouter } from "next/navigation";
import { CheckoutPage } from "../pages/checkout/CheckoutPage";
import {
  applyCheckoutRewardAction,
  estimateCheckoutPointsAction,
  startCheckoutAction,
} from "./checkout-actions";
import type { CheckoutLoyaltyData } from "../types";

export function CheckoutPageClient({
  customerEmail,
  loyalty,
}: {
  customerEmail?: string;
  loyalty: CheckoutLoyaltyData;
}) {
  const router = useRouter();

  return (
    <CheckoutPage
      onGoToTienda={() => router.push("/tienda")}
      customerEmail={customerEmail}
      loyalty={loyalty}
      onEstimate={estimateCheckoutPointsAction}
      onApplyReward={applyCheckoutRewardAction}
      onPay={async ({ email }) => {
        await startCheckoutAction(email);
      }}
    />
  );
}
