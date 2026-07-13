"use client";

// Chrome del storefront oficial OLFFY: announcement bar, navbar, footer,
// menú mobile, drawer de carrito y modal de producto — el equivalente del
// AppShell del frontend Vite, pero sobre el router real de Next.js.
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
import { ProductModal } from "../components/product";
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

// Modal de producto global (vista rápida): las páginas llaman a
// openProduct(product) desde onProductClick.
const ProductModalContext = createContext<
  ((product: Product) => void) | undefined
>(undefined);

export function useProductModal() {
  const open = useContext(ProductModalContext);
  if (!open) {
    throw new Error("useProductModal debe usarse dentro de <OlffyChrome>");
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

  return (
    <ProductModalContext.Provider value={setSelectedProduct}>
      <div className={styles.page}>
        <AnnouncementBar messages={ANNOUNCEMENTS} />
        <Navbar
          cartCount={cartCount}
          onOpenCart={openCart}
          onOpenMenu={() => setMenuOpen(true)}
          onNavigate={handleNavigate}
          loyalty={loyalty}
          loyaltyLoading={loyaltyLoading}
          onNavigatePath={(path) => router.push(path)}
          onSignOut={async () => {
            await signOutStorefrontAction();
            setLoyalty(null);
            await refreshLoyalty();
            router.refresh();
          }}
        />

        <main className={styles.main}>{children}</main>

        <Footer
          onNavigate={handleNavigate}
          onSubscribe={subscribeNewsletterAction}
        />

        <MobileMenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={handleNavigate}
          loyalty={loyalty}
          onNavigatePath={(path) => {
            router.push(path);
            setMenuOpen(false);
          }}
          onSignOut={async () => {
            await signOutStorefrontAction();
            setMenuOpen(false);
            await refreshLoyalty();
            router.refresh();
          }}
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

        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </ProductModalContext.Provider>
  );
}
