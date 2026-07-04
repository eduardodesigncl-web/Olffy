import { Button, Drawer, EmptyState, IconPlaceholder } from "../ui";
import { useCart } from "../../context/CartContext";
import { CartLineItem } from "./CartLineItem";
import styles from "./CartDrawer.module.css";

interface CartDrawerProps {
  onGoToCheckout: () => void;
  onGoToTienda: () => void;
}

// Carrito real (mock, sin persistencia): consume CartContext directamente,
// no recibe cartItems/cartCount por props — solo las acciones de navegación
// que dependen del router de la app (checkout / tienda).
export function CartDrawer({ onGoToCheckout, onGoToTienda }: CartDrawerProps) {
  const {
    cartItems,
    cartOpen,
    cartReady,
    closeCart,
    incrementQty,
    decrementQty,
    removeFromCart,
    cartCount,
    formattedCartSubtotal,
  } = useCart();

  const isEmpty = cartItems.length === 0;
  const isLoading = !cartReady && isEmpty;

  return (
    <Drawer isOpen={cartOpen} onClose={closeCart} side="right">
      <div className={styles.header}>
        <div>
          <div className={styles.headerTitle}>Tu carrito</div>
          <div className={styles.headerCount}>
            {cartCount} producto{cartCount === 1 ? "" : "s"}
          </div>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closeCart}
          aria-label="Cerrar carrito"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Cargando tu carrito…</p>
        ) : isEmpty ? (
          <EmptyState
            icon={<IconPlaceholder size={64} color="var(--olffy-amarillo)" />}
            title="Tu carrito está vacío"
            description="Agrega productos para verlos aquí."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  closeCart();
                  onGoToTienda();
                }}
              >
                Ir a la tienda
              </Button>
            }
          />
        ) : (
          cartItems.map((item) => (
            <CartLineItem
              key={item.lineId}
              item={item}
              onIncrement={incrementQty}
              onDecrement={decrementQty}
              onRemove={removeFromCart}
            />
          ))
        )}
      </div>

      {!isEmpty && (
        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{formattedCartSubtotal}</span>
          </div>
          <div className={styles.footerActions}>
            <Button
              variant="primary"
              className={styles.checkoutBtn}
              onClick={() => {
                closeCart();
                onGoToCheckout();
              }}
            >
              Ir al checkout →
            </Button>
            <Button
              variant="ghost"
              className={styles.continueBtn}
              onClick={closeCart}
            >
              Seguir comprando
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
