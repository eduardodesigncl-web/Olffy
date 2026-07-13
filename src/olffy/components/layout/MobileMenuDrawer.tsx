import { Drawer } from "../ui";
import styles from "./MobileMenuDrawer.module.css";
import type { PublicPage } from "./navigation";
import type { StorefrontLoyaltyState } from "../../types";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PublicPage) => void;
  loyalty: StorefrontLoyaltyState | null;
  onNavigatePath: (path: string) => void;
  onSignOut: () => Promise<void>;
}

const LINKS: { label: string; page: PublicPage }[] = [
  { label: "Inicio", page: "home" },
  { label: "Tienda", page: "tienda" },
  { label: "Novedades", page: "novedades" },
  { label: "Regalos", page: "regalos" },
  { label: "Nuestra historia", page: "historia" },
  { label: "Contacto", page: "contacto" },
];

// Menú lateral mobile/tablet — se abre con la hamburguesa del Navbar.
export function MobileMenuDrawer({
  isOpen,
  onClose,
  onNavigate,
  loyalty,
  onNavigatePath,
  onSignOut,
}: MobileMenuDrawerProps) {
  const go = (page: PublicPage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      panelClassName={styles.panel}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.logo}>OLFFY®</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <nav className={styles.nav}>
          <div className={styles.accountBlock}>
            {loyalty?.accountStatus === "ready" ||
            loyalty?.accountStatus === "blocked" ? (
              <>
                <div className={styles.mobileIdentity}>
                  <span>{loyalty.initial}</span>
                  <div>
                    <strong>{loyalty.displayName}</strong>
                    <small>
                      {loyalty.pointsBalance.toLocaleString("es-CL")} puntos
                    </small>
                  </div>
                </div>
                <button
                  className={styles.accountLink}
                  onClick={() => onNavigatePath("/cuenta")}
                >
                  Mi cuenta y puntos
                </button>
                <button
                  className={styles.accountLink}
                  onClick={() => onNavigatePath("/cuenta/recompensas")}
                >
                  Recompensas
                </button>
                <button
                  className={styles.accountLink}
                  onClick={() => onNavigatePath("/cuenta/canjes")}
                >
                  Mis canjes
                </button>
                <button
                  className={styles.signOutLink}
                  onClick={() => void onSignOut()}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                className={styles.loginLink}
                onClick={() =>
                  onNavigatePath(
                    `/cuenta/login?next=${encodeURIComponent(location.pathname + location.search)}`,
                  )
                }
              >
                Iniciar sesión
              </button>
            )}
          </div>
          {LINKS.map((link) => (
            <button
              key={link.page}
              className={styles.link}
              onClick={() => go(link.page)}
            >
              {link.label}
            </button>
          ))}
          <button className={styles.puntosLink} onClick={() => go("puntos")}>
            ⭐ OLFFY Puntos
          </button>
        </nav>
      </div>
    </Drawer>
  );
}
