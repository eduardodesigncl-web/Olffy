import { Button, EmptyState, IconPlaceholder } from "../ui";
import { CartLineItem } from "../cart";
import { useCart } from "../../context/CartContext";
import styles from "./CheckoutReview.module.css";

interface CheckoutReviewProps {
  onContinue: () => void;
  onGoToTienda: () => void;
}

// Paso 1 del checkout — resumen del carrito real de Shopify (reutiliza
// CartLineItem) y total. Los códigos de descuento se aplican en la pasarela
// de pago, no acá.
export function CheckoutReview({
  onContinue,
  onGoToTienda,
}: CheckoutReviewProps) {
  const {
    cartItems,
    cartReady,
    incrementQty,
    decrementQty,
    removeFromCart,
    formattedCartSubtotal,
  } = useCart();

  if (!cartReady && cartItems.length === 0) {
    return <p>Cargando tu carrito…</p>;
  }

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon={<IconPlaceholder size={64} color="var(--olffy-amarillo)" />}
        title="Tu carrito está vacío"
        description="Agrega productos antes de continuar con el checkout."
        action={
          <Button variant="primary" size="sm" onClick={onGoToTienda}>
            Ir a la tienda
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className={styles.list}>
        {cartItems.map((item) => (
          <CartLineItem
            key={item.lineId}
            item={item}
            onIncrement={incrementQty}
            onDecrement={decrementQty}
            onRemove={removeFromCart}
          />
        ))}
      </div>

      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>{formattedCartSubtotal}</span>
        </div>
        <div className={styles.grandTotalRow}>
          <span className={styles.grandTotalLabel}>Total</span>
          <span className={styles.grandTotalValue}>
            {formattedCartSubtotal}
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        className={styles.continueBtn}
        onClick={onContinue}
      >
        Continuar con el envío →
      </Button>
    </div>
  );
}
