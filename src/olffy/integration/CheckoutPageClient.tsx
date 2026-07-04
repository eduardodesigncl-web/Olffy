"use client";

import { useRouter } from "next/navigation";
import { CheckoutPage } from "../pages/checkout/CheckoutPage";
import { startCheckoutAction } from "./checkout-actions";

export function CheckoutPageClient({
  customerEmail,
}: {
  customerEmail?: string;
}) {
  const router = useRouter();

  return (
    <CheckoutPage
      onGoToTienda={() => router.push("/tienda")}
      customerEmail={customerEmail}
      onPay={async ({ email }) => {
        await startCheckoutAction(email);
      }}
    />
  );
}
