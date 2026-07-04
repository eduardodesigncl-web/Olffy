// @ts-nocheck
import { useState } from "react";
import { Navbar } from "./Navbar";
import { PromoBanner } from "./PromoBanner";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import type { CartLine } from "../../contracts/cart.types";
import { CartProvider, useCart } from "../../context/CartContext";

interface AppShellProps {
  children: React.ReactNode;
  cartLines?: CartLine[];
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  onSubNavClick?: (item: string) => void;
  onCheckout?: () => void;
  onCartRemove?: (lineId: string) => void;
  onCartIncrement?: (lineId: string) => void;
  onCartDecrement?: (lineId: string) => void;
  onAdminOpen?: () => void;
  onAccountClick?: () => void;
}

export function AppShell({
  children,
  cartLines = [],
  activeNav = "Inicio",
  onNavChange,
  onSubNavClick,
  onCheckout,
  onCartRemove,
  onCartIncrement,
  onCartDecrement,
  onAdminOpen,
  onAccountClick,
}: AppShellProps) {
  return (
    <CartProvider
      initialLines={cartLines}
      onRemoveLine={onCartRemove}
      onIncrementLine={onCartIncrement}
      onDecrementLine={onCartDecrement}
    >
      <AppShellChrome
        activeNav={activeNav}
        onNavChange={onNavChange}
        onSubNavClick={onSubNavClick}
        onCheckout={onCheckout}
        onAdminOpen={onAdminOpen}
        onAccountClick={onAccountClick}
      >
        {children}
      </AppShellChrome>
    </CartProvider>
  );
}

function AppShellChrome({
  children,
  activeNav = "Inicio",
  onNavChange,
  onSubNavClick,
  onCheckout,
  onAdminOpen,
  onAccountClick,
}: Omit<
  AppShellProps,
  "cartLines" | "onCartRemove" | "onCartIncrement" | "onCartDecrement"
>) {
  const [showBanner, setShowBanner] = useState(true);
  const [internalNav, setInternalNav] = useState(activeNav);
  const {
    lines,
    isOpen,
    openCart,
    closeCart,
    removeLine,
    incrementLine,
    decrementLine,
  } = useCart();

  const currentNav = onNavChange ? activeNav : internalNav;
  const handleNavChange = onNavChange ?? setInternalNav;

  return (
    <div className="min-h-screen w-full bg-white">
      {showBanner && <PromoBanner onClose={() => setShowBanner(false)} />}
      <Navbar
        cartCount={lines.reduce((s, l) => s + l.quantity, 0)}
        onCartClick={openCart}
        onAccountClick={onAccountClick ?? (() => {})}
        activeNav={currentNav}
        setActiveNav={(v) => {
          handleNavChange(v);
        }}
        onSubNavClick={onSubNavClick ?? (() => {})}
      />
      {isOpen && (
        <CartDrawer
          lines={lines}
          onClose={closeCart}
          onRemove={removeLine}
          onIncrement={incrementLine}
          onDecrement={decrementLine}
          onCheckout={() => {
            closeCart();
            onCheckout?.();
          }}
        />
      )}
      <main>{children}</main>
      <Footer onAdminOpen={onAdminOpen} />
    </div>
  );
}
