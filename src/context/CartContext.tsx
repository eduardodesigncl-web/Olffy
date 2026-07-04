"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "../contracts/cart.types";

type MaybePromise<T> = T | Promise<T>;

interface CartProviderProps {
  children: ReactNode;
  initialLines?: CartLine[];
  onRemoveLine?: (lineId: string) => MaybePromise<void>;
  onIncrementLine?: (lineId: string) => MaybePromise<void>;
  onDecrementLine?: (lineId: string) => MaybePromise<void>;
  onUpdateLine?: (lineId: string, quantity: number) => MaybePromise<void>;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addLine: (line: CartLine) => void;
  removeLine: (lineId: string) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  incrementLine: (lineId: string) => Promise<void>;
  decrementLine: (lineId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function updateLineQuantity(
  lines: CartLine[],
  lineId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    return lines.filter((line) => line.lineId !== lineId);
  }

  return lines.map((line) =>
    line.lineId === lineId ? { ...line, quantity } : line,
  );
}

export function CartProvider({
  children,
  initialLines = [],
  onRemoveLine,
  onIncrementLine,
  onDecrementLine,
  onUpdateLine,
}: CartProviderProps) {
  const [lines, setLines] = useState(initialLines);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addLine = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find((item) => item.lineId === line.lineId);
      if (!existing) return [...current, line];

      return current.map((item) =>
        item.lineId === line.lineId
          ? { ...item, quantity: item.quantity + line.quantity }
          : item,
      );
    });
  }, []);

  const removeLine = useCallback(
    async (lineId: string) => {
      setLines((current) => current.filter((line) => line.lineId !== lineId));
      await onRemoveLine?.(lineId);
    },
    [onRemoveLine],
  );

  const updateLine = useCallback(
    async (lineId: string, quantity: number) => {
      setLines((current) => updateLineQuantity(current, lineId, quantity));
      await onUpdateLine?.(lineId, quantity);
    },
    [onUpdateLine],
  );

  const incrementLine = useCallback(
    async (lineId: string) => {
      setLines((current) =>
        current.map((line) =>
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        ),
      );
      await onIncrementLine?.(lineId);
    },
    [onIncrementLine],
  );

  const decrementLine = useCallback(
    async (lineId: string) => {
      setLines((current) =>
        current.flatMap((line) => {
          if (line.lineId !== lineId) return [line];
          const quantity = line.quantity - 1;
          return quantity > 0 ? [{ ...line, quantity }] : [];
        }),
      );
      await onDecrementLine?.(lineId);
    },
    [onDecrementLine],
  );

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      openCart,
      closeCart,
      addLine,
      removeLine,
      updateLine,
      incrementLine,
      decrementLine,
    }),
    [
      lines,
      isOpen,
      openCart,
      closeCart,
      addLine,
      removeLine,
      updateLine,
      incrementLine,
      decrementLine,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
