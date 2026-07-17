import { Drawer } from '../ui';
import styles from './MobileMenuDrawer.module.css';
import type { PublicPage } from './navigation';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PublicPage) => void;
}

const LINKS: { label: string; page: PublicPage }[] = [
  { label: 'Inicio', page: 'home' },
  { label: 'Tienda', page: 'tienda' },
  { label: 'Novedades', page: 'novedades' },
  { label: 'Regalos', page: 'regalos' },
  { label: 'Nuestra historia', page: 'historia' },
  { label: 'Contacto', page: 'contacto' },
];

// Menú lateral mobile/tablet — se abre con la hamburguesa del Navbar.
export function MobileMenuDrawer({ isOpen, onClose, onNavigate }: MobileMenuDrawerProps) {
  const go = (page: PublicPage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} side="left" panelClassName={styles.panel}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.logo}>OLFFY®</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>
        <nav className={styles.nav}>
          {LINKS.map((link) => (
            <button type="button" key={link.page} className={styles.link} onClick={() => go(link.page)}>
              {link.label}
            </button>
          ))}
          <button type="button" className={styles.puntosLink} onClick={() => go('puntos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2.5l3.09 6.26L22 9.77l-5 4.87 1.18 6.86L12 18.27l-6.18 3.23L7 14.64l-5-4.87 6.91-1.01L12 2.5z" />
            </svg>
            OLFFY Puntos
          </button>
        </nav>
      </div>
    </Drawer>
  );
}
