"use client";

import { useState } from "react";
import { Button, Drawer, EmptyState, IconPlaceholder } from "../ui";
import { useCart } from "../../context/CartContext";
import { CartLineItem } from "./CartLineItem";
import styles from "./CartDrawer.module.css";
import type { StorefrontLoyaltyState } from "../../types";
import {
  applyCartRewardAction,
  removeCartRewardAction,
} from "../../integration/checkout-actions";

interface CartDrawerProps {
  loyalty: StorefrontLoyaltyState | null;
  loyaltyLoading: boolean;
  onLoyaltyChange: (state: StorefrontLoyaltyState) => void;
  onRefreshLoyalty: () => Promise<void>;
  onGoToCheckout: () => Promise<string>;
  onGoToTienda: () => void;
  onLogin: () => void;
}

function formatClp(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

export function CartDrawer({
  loyalty,
  loyaltyLoading,
  onLoyaltyChange,
  onRefreshLoyalty,
  onGoToCheckout,
  onGoToTienda,
  onLogin,
}: CartDrawerProps) {
  const {
    cartItems,
    cartOpen,
    cartReady,
    cartPending,
    pendingVariantIds,
    closeCart,
    incrementQty,
    decrementQty,
    removeFromCart,
    flushCartMutations,
    cartCount,
    cartSubtotal,
  } = useCart();
  const [rewardPending, setRewardPending] = useState<number | "remove" | null>(
    null,
  );
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const isEmpty = cartItems.length === 0;
  const isLoading = !cartReady && isEmpty;
  const subtotal = loyalty?.subtotal || cartSubtotal;
  const discount = loyalty?.discount ?? 0;
  const total = loyalty?.total || Math.max(subtotal - discount, 0);
  const nextReward = loyalty?.rewards.find(
    (reward) => reward.missingPoints > 0,
  );

  async function applyReward(rewardId: number) {
    setRewardPending(rewardId);
    setFeedback(null);
    const result = await applyCartRewardAction({
      rewardId,
      requestId: crypto.randomUUID(),
    });
    if (result.state) onLoyaltyChange(result.state);
    setFeedback({
      kind: result.ok ? "ok" : "error",
      text: result.message ?? "Estado actualizado.",
    });
    setRewardPending(null);
    if (!result.state) await onRefreshLoyalty();
  }

  async function removeReward() {
    setRewardPending("remove");
    setFeedback(null);
    const result = await removeCartRewardAction();
    if (result.state) onLoyaltyChange(result.state);
    setFeedback({
      kind: result.ok ? "ok" : "error",
      text: result.message ?? "Estado actualizado.",
    });
    setRewardPending(null);
    if (!result.state) await onRefreshLoyalty();
  }

  async function checkout() {
    setCheckoutPending(true);
    setFeedback(null);
    try {
      // Nunca enviar un carrito antiguo: fuerza el flush de mutaciones
      // coalescidas y espera a que Shopify confirme antes de ir al pago.
      await flushCartMutations();
      const checkoutUrl = await onGoToCheckout();
      window.location.assign(checkoutUrl);
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo abrir el pago seguro.",
      });
      setCheckoutPending(false);
    }
  }

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
          <p className={styles.loading}>Cargando tu carrito…</p>
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
          <>
            {cartItems.map((item) => (
              <CartLineItem
                key={item.lineId}
                item={item}
                pending={pendingVariantIds.includes(item.variantId)}
                onIncrement={incrementQty}
                onDecrement={decrementQty}
                onRemove={removeFromCart}
              />
            ))}

            <section
              className={styles.loyalty}
              aria-labelledby="cart-loyalty-title"
            >
              <div className={styles.loyaltyHeading}>
                <div>
                  <span className={styles.eyebrow}>OLFFY PUNTOS</span>
                  <h3 id="cart-loyalty-title">Usa tus puntos</h3>
                </div>
                {loyalty?.accountStatus === "ready" && (
                  <strong>
                    {loyalty.pointsBalance.toLocaleString("es-CL")} pts
                  </strong>
                )}
              </div>

              {loyaltyLoading && !loyalty ? (
                <p className={styles.muted}>Cargando tu saldo y recompensas…</p>
              ) : loyalty?.accountStatus === "signed_out" ||
                loyalty?.accountStatus === "not_enrolled" ||
                !loyalty ? (
                <div className={styles.loginPrompt}>
                  <p>
                    Inicia sesión para ver tu saldo y aplicar una recompensa
                    antes de pagar.
                  </p>
                  <Button variant="secondary" size="sm" onClick={onLogin}>
                    Iniciar sesión
                  </Button>
                </div>
              ) : loyalty.accountStatus === "blocked" ? (
                <p className={styles.errorBox}>
                  Tu cuenta de puntos no está activa. Contacta a OLFFY.
                </p>
              ) : loyalty.activeReward ? (
                <div className={styles.appliedReward}>
                  <div>
                    <span>
                      {loyalty.activeReward.applicable
                        ? "Beneficio aplicado"
                        : "Beneficio requiere actualización"}
                    </span>
                    <strong>{loyalty.activeReward.name}</strong>
                    <small>
                      −{formatClp(loyalty.activeReward.discountAmountClp)} ·{" "}
                      {loyalty.activeReward.pointsSpent} pts
                    </small>
                  </div>
                  <div className={styles.appliedActions}>
                    {!loyalty.activeReward.applicable && (
                      <button
                        disabled={rewardPending !== null}
                        onClick={() =>
                          void applyReward(loyalty.activeReward!.rewardId)
                        }
                      >
                        {rewardPending === loyalty.activeReward.rewardId
                          ? "Aplicando…"
                          : "Volver a aplicar"}
                      </button>
                    )}
                    <button
                      disabled={rewardPending !== null}
                      onClick={() => void removeReward()}
                    >
                      {rewardPending === "remove"
                        ? "Quitando…"
                        : "Quitar o cambiar"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {nextReward && (
                    <p className={styles.nextReward}>
                      Te faltan{" "}
                      <strong>{nextReward.missingPoints} puntos</strong> para{" "}
                      {nextReward.name}.
                    </p>
                  )}
                  <div className={styles.rewardList}>
                    {loyalty.rewards.map((reward) => (
                      <div className={styles.rewardCard} key={reward.id}>
                        <div>
                          <strong>{reward.name}</strong>
                          <span>
                            {reward.pointsCost.toLocaleString("es-CL")} pts · −
                            {formatClp(reward.discountAmountClp)}
                          </span>
                          {reward.minimumMissingClp > 0 && (
                            <small>
                              Agrega {formatClp(reward.minimumMissingClp)} para
                              cumplir el mínimo.
                            </small>
                          )}
                          {reward.missingPoints > 0 && (
                            <small>
                              Te faltan{" "}
                              {reward.missingPoints.toLocaleString("es-CL")}{" "}
                              puntos.
                            </small>
                          )}
                        </div>
                        <button
                          disabled={
                            !reward.eligible ||
                            rewardPending !== null ||
                            cartPending
                          }
                          onClick={() => void applyReward(reward.id)}
                        >
                          {rewardPending === reward.id
                            ? "Aplicando…"
                            : "Canjear"}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {feedback && (
                <p
                  role="status"
                  className={
                    feedback.kind === "ok" ? styles.successBox : styles.errorBox
                  }
                >
                  {feedback.text}
                </p>
              )}
            </section>
          </>
        )}
      </div>

      {!isEmpty && (
        <div className={styles.footer}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatClp(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
              <span>Descuento</span>
              <span>−{formatClp(discount)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total estimado</span>
            <span className={styles.totalValue}>{formatClp(total)}</span>
          </div>
          <p className={styles.shopifyNote}>
            Dirección, despacho y pago se completan de forma segura en Shopify.
          </p>
          <div className={styles.footerActions}>
            <Button
              variant="primary"
              className={styles.checkoutBtn}
              disabled={
                checkoutPending || cartPending || rewardPending !== null
              }
              onClick={() => void checkout()}
            >
              {checkoutPending ? "Abriendo pago…" : "Ir a pago seguro →"}
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
