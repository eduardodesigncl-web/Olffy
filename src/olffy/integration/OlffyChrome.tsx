"use client";

// Chrome del storefront oficial OLFFY: announcement bar, navbar, footer,
// menú mobile y drawer de carrito — el equivalente del AppShell del frontend
// Vite, pero sobre el router real de Next.js. El detalle de producto ya no es
// un modal: navega a /tienda/[handle] (página real, igual que el App.tsx nuevo).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "../App.module.css";
import {
  AnnouncementBar,
  Footer,
  MobileMenuDrawer,
  Navbar,
} from "../components/layout";
import type { PublicPage } from "../components/layout";
import { CartDrawer } from "../components/cart";
import { CartProvider, useCart } from "../context/CartContext";
import type { Product, StorefrontLoyaltyState } from "../types";
import { subscribeNewsletterAction } from "./marketing-actions";
import {
  getStorefrontLoyaltyStateAction,
  signOutStorefrontAction,
  startCheckoutAction,
} from "./checkout-actions";

const ANNOUNCEMENTS = [
  "Envíos a todo Chile",
  "Retiro gratis en tienda · Viña del Mar",
  "Cuadernos, planners, stickers y papelería ilustrada",
  "Hecho con amor, claro",
];

export const PAGE_ROUTES: Record<PublicPage, string> = {
  home: "/",
  tienda: "/tienda",
  novedades: "/novedades",
  regalos: "/regalos",
  historia: "/nuestra-historia",
  contacto: "/contacto",
  puntos: "/cuenta",
  checkout: "/checkout",
};

// Apertura del detalle de producto: navega a la página real /tienda/[handle].
const OpenProductContext = createContext<
  ((product: Product) => void) | undefined
>(undefined);

export function useOpenProduct() {
  const open = useContext(OpenProductContext);
  if (!open) {
    throw new Error("useOpenProduct debe usarse dentro de <OlffyChrome>");
  }
  return open;
}

export function OlffyChrome({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <ChromeInner>{children}</ChromeInner>
    </CartProvider>
  );
}

function ChromeInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount, cartOpen, cartPending, openCart } = useCart();
  const [loyalty, setLoyalty] = useState<StorefrontLoyaltyState | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);

  const refreshLoyalty = useCallback(async () => {
    setLoyaltyLoading(true);
    try {
      setLoyalty(await getStorefrontLoyaltyStateAction());
    } catch (error) {
      console.error("No se pudo cargar la sesión OLFFY", error);
    } finally {
      setLoyaltyLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLoyalty();
  }, [refreshLoyalty]);

  useEffect(() => {
    if (cartOpen && !cartPending) void refreshLoyalty();
  }, [cartCount, cartOpen, cartPending, refreshLoyalty]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("cart") !== "open") return;
    openCart();
    searchParams.delete("cart");
    window.history.replaceState(
      window.history.state,
      "",
      searchParams.size ? `${pathname}?${searchParams}` : pathname,
    );
  }, [openCart, pathname]);

  const handleNavigate = (page: PublicPage) => {
    const route = PAGE_ROUTES[page];
    if (route && route !== pathname) router.push(route);
  };

  const openProduct = useCallback(
    (product: Product) => {
      router.push(`/tienda/${product.handle}`);
    },
    [router],
  );

  const account =
    loyalty?.accountStatus === "ready" && loyalty.displayName && loyalty.initial
      ? {
          displayName: loyalty.displayName,
          initial: loyalty.initial,
          pointsBalance: loyalty.pointsBalance,
        }
      : null;

  const handleSignOut = async () => {
    await signOutStorefrontAction();
    // Igual que en el login, la navegación completa evita que una transición
    // prefetched conserve por un instante la sesión anterior.
    window.location.assign("/cuenta/login?signedOut=1");
  };

  return (
    <OpenProductContext.Provider value={openProduct}>
      <div className={styles.page}>
        <AnnouncementBar messages={ANNOUNCEMENTS} />
        <Navbar
          cartCount={cartCount}
          account={account}
          accountLoading={loyaltyLoading}
          onOpenCart={openCart}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenAccount={() => router.push("/cuenta")}
          onOpenRewards={() => router.push("/cuenta?tab=recompensas")}
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
        />

        <main className={styles.main}>{children}</main>

        <Footer
          onNavigate={handleNavigate}
          onSubscribe={subscribeNewsletterAction}
          onEnterAdmin={() => router.push("/admin")}
        />

        <MobileMenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={handleNavigate}
        />

        <CartDrawer
          loyalty={loyalty}
          loyaltyLoading={loyaltyLoading}
          onLoyaltyChange={setLoyalty}
          onRefreshLoyalty={refreshLoyalty}
          onGoToCheckout={startCheckoutAction}
          onLogin={() =>
            router.push(
              `/cuenta/login?next=${encodeURIComponent(`${pathname}?cart=open`)}`,
            )
          }
          onGoToTienda={() => router.push("/tienda")}
        />
      </div>
    </OpenProductContext.Provider>
  );
}
