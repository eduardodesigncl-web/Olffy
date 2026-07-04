import styles from "./Navbar.module.css";
import { NavDropdown } from "./NavDropdown";
import type { PublicPage } from "./navigation";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenMenu: () => void;
  onNavigate: (page: PublicPage) => void;
}

// Navbar sticky del storefront: logo, nav desktop con dropdowns, cuenta,
// carrito con contador y hamburguesa (mobile/tablet vía CSS media query).
export function Navbar({
  cartCount,
  onOpenCart,
  onOpenMenu,
  onNavigate,
}: NavbarProps) {
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
          <button
            className={styles.iconBtn}
            aria-label="Cuenta"
            onClick={() => onNavigate("puntos")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
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
