"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import styles from "./Navbar.module.css";
import type { PublicPage } from "./navigation";

type AccountSummary = {
  displayName: string;
  initial: string;
  pointsBalance: number;
};

interface NavbarProps {
  cartCount: number;
  account: AccountSummary | null;
  accountLoading: boolean;
  searchOpen: boolean;
  onToggleSearch: () => void;
  searchButtonRef?: Ref<HTMLButtonElement>;
  onOpenCart: () => void;
  onOpenMenu: () => void;
  onOpenAccount: () => void;
  onOpenRewards: () => void;
  onSignOut: () => Promise<void>;
  onNavigate: (page: PublicPage) => void;
}

// Navbar sticky del storefront: logo, nav desktop con links simples, cuenta,
// carrito con contador y hamburguesa (mobile/tablet vía CSS media query).
// Las categorías (Cuadernos, Planners, etc.) viven dentro de Tienda como
// filtros internos, no como páginas del navbar.
export function Navbar({
  cartCount,
  account,
  accountLoading,
  searchOpen,
  onToggleSearch,
  searchButtonRef,
  onOpenCart,
  onOpenMenu,
  onOpenAccount,
  onOpenRewards,
  onSignOut,
  onNavigate,
}: NavbarProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const openAccountPage = () => {
    setAccountOpen(false);
    onOpenAccount();
  };

  const openRewards = () => {
    setAccountOpen(false);
    onOpenRewards();
  };

  const handleAccountClick = () => {
    if (!account) {
      onOpenAccount();
      return;
    }
    setAccountOpen((open) => !open);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
      setAccountOpen(false);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.logoBtn}
          onClick={() => onNavigate("home")}
          aria-label="Inicio"
        >
          <span className={styles.logo}>OLFFY®</span>
        </button>

        <div className={styles.desktopNav}>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("home")}
          >
            Inicio
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("tienda")}
          >
            Tienda
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("novedades")}
          >
            Novedades
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("regalos")}
          >
            Regalos
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("historia")}
          >
            Nuestra historia
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => onNavigate("contacto")}
          >
            Contacto
          </button>
        </div>

        <div className={styles.actions}>
          {/* Lupa de búsqueda global: inmediatamente a la izquierda del
              icono de usuario en todos los viewports. */}
          <button
            type="button"
            ref={searchButtonRef}
            className={styles.iconBtn}
            aria-label="Buscar productos"
            aria-expanded={searchOpen}
            aria-controls="global-product-search"
            onClick={onToggleSearch}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <div className={styles.accountWrap} ref={accountRef}>
            <button
              type="button"
              className={`${styles.iconBtn} ${account ? styles.accountActive : ""}`}
              aria-label={
                account ? `Cuenta de ${account.displayName}` : "Iniciar sesión"
              }
              aria-haspopup={account ? "menu" : undefined}
              aria-expanded={account ? accountOpen : undefined}
              onClick={handleAccountClick}
              disabled={accountLoading}
            >
              {account ? (
                <span className={styles.accountInitial} aria-hidden="true">
                  {account.initial}
                </span>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </button>

            {account && accountOpen && (
              <div className={styles.accountMenu} role="menu">
                <div className={styles.accountHeader}>
                  <span className={styles.accountName}>
                    {account.displayName}
                  </span>
                  <span className={styles.accountPoints}>
                    {account.pointsBalance.toLocaleString("es-CL")} pts
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.accountOption}
                  role="menuitem"
                  onClick={openAccountPage}
                >
                  Mi cuenta
                </button>
                <button
                  type="button"
                  className={styles.accountOption}
                  role="menuitem"
                  onClick={openRewards}
                >
                  Mis recompensas
                </button>
                <button
                  type="button"
                  className={`${styles.accountOption} ${styles.signOutOption}`}
                  role="menuitem"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                >
                  {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.cartBtn}
            aria-label="Carrito"
            onClick={onOpenCart}
          >
            {/* Bolsa de compra OLFFY con patita: asas + cuerpo (trazo) y pata (relleno). */}
            <svg
              className={styles.cartIcon}
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M5.6 8.4h12.8a.6.6 0 0 1 .6.66l-.92 10.5A2.2 2.2 0 0 1 15.9 21.6H8.1a2.2 2.2 0 0 1-2.18-2.04L5 9.06a.6.6 0 0 1 .6-.66z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <ellipse cx="12" cy="16.7" rx="2" ry="1.7" fill="currentColor" />
              <circle cx="9.6" cy="14.1" r="0.95" fill="currentColor" />
              <circle cx="12" cy="13.4" r="1" fill="currentColor" />
              <circle cx="14.4" cy="14.1" r="0.95" fill="currentColor" />
            </svg>
            <span className={styles.cartBadge}>{cartCount}</span>
          </button>
          <button
            type="button"
            className={styles.hamburger}
            aria-label="Menú"
            onClick={onOpenMenu}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
