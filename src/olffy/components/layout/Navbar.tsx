"use client";

import styles from "./Navbar.module.css";
import { NavDropdown } from "./NavDropdown";
import type { PublicPage } from "./navigation";
import type { StorefrontLoyaltyState } from "../../types";
import { useEffect, useRef, useState } from "react";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenMenu: () => void;
  onNavigate: (page: PublicPage) => void;
  loyalty: StorefrontLoyaltyState | null;
  loyaltyLoading: boolean;
  onNavigatePath: (path: string) => void;
  onSignOut: () => Promise<void>;
}

// Navbar sticky del storefront: logo, nav desktop con dropdowns, cuenta,
// carrito con contador y hamburguesa (mobile/tablet vía CSS media query).
export function Navbar({
  cartCount,
  onOpenCart,
  onOpenMenu,
  onNavigate,
  loyalty,
  loyaltyLoading,
  onNavigatePath,
  onSignOut,
}: NavbarProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const signedIn =
    loyalty?.accountStatus === "ready" || loyalty?.accountStatus === "blocked";

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <button
          className={styles.logoBtn}
          onClick={() => onNavigate("home")}
          aria-label="Inicio"
        >
          <span className={styles.logo}>OLFFY®</span>
        </button>

        <div className={styles.desktopNav}>
          <button className={styles.navLink} onClick={() => onNavigate("home")}>
            Inicio
          </button>
          <NavDropdown
            label="Tienda"
            onLabelClick={() => onNavigate("tienda")}
            items={[
              { label: "Cuadernos", onClick: () => onNavigate("tienda") },
              { label: "Planners", onClick: () => onNavigate("tienda") },
              { label: "Stickers", onClick: () => onNavigate("tienda") },
              { label: "Calendarios", onClick: () => onNavigate("tienda") },
              { label: "Regalos", onClick: () => onNavigate("regalos") },
            ]}
          />
          <NavDropdown
            label="Novedades"
            onLabelClick={() => onNavigate("novedades")}
            items={[
              {
                label: "Nuevas colecciones",
                onClick: () => onNavigate("novedades"),
              },
              {
                label: "Recién llegados",
                onClick: () => onNavigate("novedades"),
              },
              { label: "Próximamente", onClick: () => onNavigate("novedades") },
            ]}
          />
          <NavDropdown
            label="Regalos"
            onLabelClick={() => onNavigate("regalos")}
            items={[
              { label: "Para amigas", onClick: () => onNavigate("regalos") },
              {
                label: "Para estudiantes",
                onClick: () => onNavigate("regalos"),
              },
              { label: "Kits de regalo", onClick: () => onNavigate("regalos") },
              {
                label: "Por presupuesto",
                onClick: () => onNavigate("regalos"),
              },
            ]}
          />
          <button
            className={styles.navLink}
            onClick={() => onNavigate("historia")}
          >
            Nuestra historia
          </button>
          <button
            className={styles.navLink}
            onClick={() => onNavigate("contacto")}
          >
            Contacto
          </button>
        </div>

        <div className={styles.actions}>
          <div className={styles.account} ref={accountRef}>
            {loyaltyLoading && !loyalty ? (
              <span
                className={styles.accountLoading}
                aria-label="Cargando sesión"
              />
            ) : signedIn ? (
              <button
                className={styles.avatarBtn}
                aria-label={`Cuenta de ${loyalty?.displayName ?? "cliente"}`}
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                {loyalty?.initial ?? "O"}
              </button>
            ) : (
              <button
                className={styles.loginBtn}
                onClick={() =>
                  onNavigatePath(
                    `/cuenta/login?next=${encodeURIComponent(location.pathname + location.search)}`,
                  )
                }
              >
                Iniciar sesión
              </button>
            )}
            {signedIn && accountOpen && (
              <div className={styles.accountMenu} role="menu">
                <div className={styles.accountSummary}>
                  <strong>{loyalty?.displayName}</strong>
                  <span>
                    {loyalty?.pointsBalance.toLocaleString("es-CL")} puntos
                  </span>
                </div>
                <button onClick={() => onNavigatePath("/cuenta")}>
                  Mi cuenta
                </button>
                <button onClick={() => onNavigatePath("/cuenta")}>
                  Mis puntos
                </button>
                <button onClick={() => onNavigatePath("/cuenta/recompensas")}>
                  Recompensas
                </button>
                <button onClick={() => onNavigatePath("/cuenta/canjes")}>
                  Mis canjes
                </button>
                <button
                  className={styles.signOut}
                  onClick={() => void onSignOut()}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
          <button
            className={styles.cartBtn}
            aria-label="Carrito"
            onClick={onOpenCart}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 7h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 4H2" />
              <circle cx="9" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
            <span className={styles.cartBadge}>{cartCount}</span>
          </button>
          <button
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
