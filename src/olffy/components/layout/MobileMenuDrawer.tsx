import { Drawer } from "../ui";
import styles from "./MobileMenuDrawer.module.css";
import type { PublicPage } from "./navigation";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PublicPage) => void;
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
