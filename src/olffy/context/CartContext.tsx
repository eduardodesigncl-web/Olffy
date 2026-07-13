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
import {
  addToCartAction,
  decrementCartLineAction,
  incrementCartLineAction,
  removeCartLineAction,
} from "src/integration/actions";
import { getCartItemsAction } from "src/olffy/integration/cart-actions";
import type { CartItem, Product } from "../types";

interface CartContextValue {
  cartItems: CartItem[];
  cartOpen: boolean;
  cartReady: boolean;
  cartPending: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (lineId: string) => void;
  incrementQty: (lineId: string) => void;
  decrementQty: (lineId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  formattedCartSubtotal: string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function formatClp(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

// Las líneas creadas de forma optimista todavía no existen en Shopify;
// se identifican con este prefijo hasta que llegue la reconciliación.
const PENDING_PREFIX = "pending:";

// Estado global de carrito respaldado por el carrito real de Shopify.
// El carrito se carga DESPUÉS del primer pintado (getCartItemsAction), así
// ninguna página bloquea su render esperando a Shopify. Las mutaciones se
// aplican optimistas en local y se reconcilian con el server al terminar.
export function CartProvider({ children }: { children: ReactNode }) {
  // El primer render debe ser idéntico en servidor y navegador; Shopify se
  // sincroniza después de hidratar y luego las mutaciones quedan optimistas.
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const pendingOpsRef = useRef(0);

  const syncFromServer = useCallback(async () => {
    try {
      const items = await getCartItemsAction();
      // Si hay mutaciones en vuelo, esta respuesta ya está desactualizada:
      // la reconciliación final la hará la última operación pendiente.
      if (pendingOpsRef.current > 0) return;
      setCartItems(items);
    } catch (error) {
      console.error("No se pudo sincronizar el carrito", error);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    void syncFromServer();
  }, [syncFromServer]);

  const runServer = useCallback((action: () => Promise<unknown>) => {
    pendingOpsRef.current += 1;
    setPendingOps((n) => n + 1);
    void (async () => {
      try {
        await action();
      } catch (error) {
        console.error("Error actualizando el carrito", error);
      } finally {
        pendingOpsRef.current -= 1;
        setPendingOps((n) => n - 1);
        if (pendingOpsRef.current === 0) {
          try {
            const items = await getCartItemsAction();
            if (pendingOpsRef.current === 0) {
              setCartItems(items);
            }
          } catch (error) {
            console.error("No se pudo sincronizar el carrito", error);
          }
        }
      }
    })();
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const applyLocal = useCallback((update: (prev: CartItem[]) => CartItem[]) => {
    setCartItems((prev) => update(prev));
  }, []);

  const addToCart = useCallback(
    (product: Product, qty: number = 1) => {
      if (!product.variantId) return;

      applyLocal((prev) => {
        const idx = prev.findIndex(
          (item) => item.variantId === product.variantId,
        );
        if (idx >= 0) {
          const next = [...prev];
          const current = next[idx]!;
          next[idx] = { ...current, qty: current.qty + qty };
          return next;
        }
        return [
          ...prev,
          {
            ...product,
            qty,
            lineId: `${PENDING_PREFIX}${product.variantId}`,
          },
        ];
      });
      runServer(() => addToCartAction(product.id, product.variantId, qty));
    },
    [applyLocal, runServer],
  );

  const removeFromCart = useCallback(
    (lineId: string) => {
      applyLocal((prev) => prev.filter((item) => item.lineId !== lineId));
      if (!lineId.startsWith(PENDING_PREFIX)) {
        runServer(() => removeCartLineAction(lineId));
      }
    },
    [applyLocal, runServer],
  );

  const incrementQty = useCallback(
    (lineId: string) => {
      applyLocal((prev) =>
        prev.map((item) =>
          item.lineId === lineId ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
      if (!lineId.startsWith(PENDING_PREFIX)) {
        runServer(() => incrementCartLineAction(lineId));
      }
    },
    [applyLocal, runServer],
  );

  const decrementQty = useCallback(
    (lineId: string) => {
      const current = cartItems.find((item) => item.lineId === lineId);
      if (!current || current.qty <= 1) return;

      applyLocal((prev) =>
        prev.map((item) =>
          item.lineId === lineId
            ? { ...item, qty: Math.max(1, item.qty - 1) }
            : item,
        ),
      );
      if (!lineId.startsWith(PENDING_PREFIX)) {
        runServer(() => decrementCartLineAction(lineId));
      }
    },
    [applyLocal, cartItems, runServer],
  );

  const clearCart = useCallback(() => {
    applyLocal(() => []);
  }, [applyLocal]);

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
    cartPending: pendingOps > 0,
    openCart,
    closeCart,
    addToCart,
    removeFromCart,
    incrementQty,
    decrementQty,
    clearCart,
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
