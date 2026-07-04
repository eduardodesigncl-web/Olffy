import { getCustomerAccountState } from "lib/customer/auth";
import { Suspense } from "react";
import { CheckoutPageClient } from "src/olffy/integration/CheckoutPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

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

  try {
    const account = await getCustomerAccountState();
    if (account.status === "ready") {
      customerEmail = account.customer.email;
    }
  } catch {
    // sin sesión de cliente: checkout como invitado
  }

  return <CheckoutPageClient customerEmail={customerEmail} />;
}
