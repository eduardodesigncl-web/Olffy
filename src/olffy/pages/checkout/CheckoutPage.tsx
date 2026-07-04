import { useState } from "react";
import {
  CheckoutStepper,
  CheckoutReview,
  CheckoutShipping,
  CheckoutPayment,
} from "../../components/checkout";
import type { CheckoutStep, ShippingForm } from "../../components/checkout";
import { useCart } from "../../context/CartContext";
import styles from "./CheckoutPage.module.css";

interface CheckoutPageProps {
  onGoToTienda: () => void;
  // Inicia el pago real: crea la intención TUU (o redirige al checkout de
  // Shopify) y navega a la pasarela. El email permite acumular OLFFY Puntos.
  onPay: (info: { email: string }) => Promise<void>;
  // Email del cliente logueado (si existe) para pre-llenar el formulario.
  customerEmail?: string;
}

const EMPTY_SHIPPING_FORM: ShippingForm = {
  nombre: "",
  apellido: "",
  email: "",
  direccion: "",
  region: "",
  comuna: "",
};

const STEP_TITLES: Record<Exclude<CheckoutStep, "success">, string> = {
  review: "Revisa tu pedido",
  shipping: "Datos de envío",
  payment: "Método de pago",
};

// Checkout real de 3 pasos (review → shipping → payment). El paso final
// redirige a la pasarela de pago (TUU / checkout Shopify); la confirmación
// de la orden ocurre allá.
export function CheckoutPage({
  onGoToTienda,
  onPay,
  customerEmail,
}: CheckoutPageProps) {
  const { formattedCartSubtotal } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("review");
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    ...EMPTY_SHIPPING_FORM,
    email: customerEmail ?? "",
  });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    if (paying) return;
    setPaying(true);
    setPayError(null);
    try {
      await onPay({ email: shippingForm.email });
    } catch (error) {
      // Un redirect de Next.js llega acá como excepción especial: se relanza.
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        String((error as { digest?: unknown }).digest).startsWith(
          "NEXT_REDIRECT",
        )
      ) {
        throw error;
      }
      setPayError("No se pudo iniciar el pago. Intenta de nuevo.");
      setPaying(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.backLink} onClick={onGoToTienda}>
        ← Volver a la tienda
      </button>

      <CheckoutStepper currentStep={checkoutStep} />

      <h1 className={styles.title}>
        {STEP_TITLES[checkoutStep as Exclude<CheckoutStep, "success">]}
      </h1>

      {checkoutStep === "review" && (
        <CheckoutReview
          onContinue={() => setCheckoutStep("shipping")}
          onGoToTienda={onGoToTienda}
        />
      )}

      {checkoutStep === "shipping" && (
        <CheckoutShipping
          form={shippingForm}
          onChange={handleShippingChange}
          onContinue={() => setCheckoutStep("payment")}
          onBack={() => setCheckoutStep("review")}
        />
      )}

      {checkoutStep === "payment" && (
        <CheckoutPayment
          formattedTotal={formattedCartSubtotal}
          paying={paying}
          error={payError}
          onFinish={() => {
            void handleFinish();
          }}
          onBack={() => setCheckoutStep("shipping")}
        />
      )}
    </div>
  );
}
