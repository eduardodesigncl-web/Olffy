"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  addCartLinesAction,
  getCartItemsAction,
  removeCartLinesAction,
  setCartLineQuantityAction,
} from "src/olffy/integration/cart-actions";
import type { CartItem, Product } from "../types";
import { createCartSyncEngine, type CartSyncEngine } from "./cart-sync";

interface CartContextValue {
  cartItems: CartItem[];
  cartOpen: boolean;
  cartReady: boolean;
  cartPending: boolean;
  // Variantes con mutaciones en curso: permite mostrar loading solo en la
  // línea afectada, sin bloquear el resto del carrito.
  pendingVariantIds: string[];
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (lineId: string) => void;
  incrementQty: (lineId: string) => void;
  decrementQty: (lineId: string) => void;
  clearCart: () => void;
  // Espera (o fuerza) las mutaciones pendientes; el checkout lo usa para
  // nunca enviar un carrito antiguo.
  flushCartMutations: () => Promise<void>;
  cartCount: number;
  cartSubtotal: number;
  formattedCartSubtotal: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function formatClp(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

// Estado global de carrito respaldado por el carrito real de Shopify.
// El carrito se carga DESPUÉS del primer pintado (getCartItemsAction), así
// ninguna página bloquea su render esperando a Shopify. Las mutaciones se
// aplican optimistas al instante y reconcilian con el carrito que devuelve
// la propia mutación (una sola llamada de red por operación consolidada);
// el motor de cart-sync coalesce clics, ignora respuestas viejas y hace
// rollback visible si Shopify rechaza la operación.
export function CartProvider({ children }: { children: ReactNode }) {
  // El primer render debe ser idéntico en servidor y navegador; Shopify se
  // sincroniza después de hidratar y luego las mutaciones quedan optimistas.
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pendingVariantIds, setPendingVariantIds] = useState<string[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const engineRef = useRef<CartSyncEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createCartSyncEngine(
      {
        addLines: addCartLinesAction,
        setLineQuantity: setCartLineQuantityAction,
        removeLine: removeCartLinesAction,
      },
      {
        onItems: setCartItems,
        onPending: setPendingVariantIds,
        onError: (error) => toast.error(error.message),
      },
    );
  }
  const engine = engineRef.current;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await getCartItemsAction();
        if (!cancelled) engine.hydrate(items);
      } catch (error) {
        console.error("No se pudo sincronizar el carrito", error);
      } finally {
        if (!cancelled) setCartReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCart = useCallback(
    (product: Product, qty: number = 1) => engine.add(product, qty),
    [engine],
  );
  const removeFromCart = useCallback(
    (lineId: string) => engine.remove(lineId),
    [engine],
  );
  const incrementQty = useCallback(
    (lineId: string) => engine.increment(lineId),
    [engine],
  );
  const decrementQty = useCallback(
    (lineId: string) => engine.decrement(lineId),
    [engine],
  );
  const clearCart = useCallback(() => engine.clear(), [engine]);
  const flushCartMutations = useCallback(() => engine.flush(), [engine]);

  const cartCount = useMemo(
    () => cartItems.reduce((s, i) => s + i.qty, 0),
    [cartItems],
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((s, i) => s + i.n * i.qty, 0),
    [cartItems],
  );
  const formattedCartSubtotal = useMemo(
    () => formatClp(cartSubtotal),
    [cartSubtotal],
  );

  const value: CartContextValue = {
    cartItems,
    cartOpen,
    cartReady,
    cartPending: pendingVariantIds.length > 0,
    pendingVariantIds,
    openCart,
    closeCart,
    addToCart,
    removeFromCart,
    incrementQty,
    decrementQty,
    clearCart,
    flushCartMutations,
    cartCount,
    cartSubtotal,
    formattedCartSubtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
