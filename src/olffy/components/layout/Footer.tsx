import styles from "./Footer.module.css";
import { NewsletterForm } from "./NewsletterForm";
import type { PublicPage } from "./navigation";

interface FooterProps {
  onNavigate: (page: PublicPage) => void;
  onSubscribe?: (email: string) => Promise<{
    success: boolean;
    error?: string;
    pending?: boolean;
  }>;
}

const COPYRIGHT_YEAR = 2026;

// Footer del storefront: marca, columnas de links, newsletter y bottom bar.
// Nota: el original esconde el acceso a /admin en un triple-click sobre el
// texto "Hecho por Mouselabs" de la bottom bar — esa lógica se conecta en la
// fase de Admin, acá el texto es solo estático.
export function Footer({ onNavigate, onSubscribe }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <span className={styles.logo}>OLFFY®</span>
            <p className={styles.tagline}>
              Papelería ilustrada para organizar, crear y regalar con magia.
            </p>
            <div className={styles.social}>
              <a className={styles.socialLink} href="#" aria-label="Instagram">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className={styles.colTitle}>Tienda</h3>
            <div className={styles.linkList}>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("tienda")}
              >
                Ver catálogo
              </button>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("novedades")}
              >
                Novedades
              </button>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("regalos")}
              >
                Regalos
              </button>
            </div>
          </div>

          <div>
            <h3 className={styles.colTitle}>Nosotros</h3>
            <div className={styles.linkList}>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("historia")}
              >
                Nuestra historia
              </button>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("contacto")}
              >
                Contacto
              </button>
              <button
                className={styles.linkBtn}
                onClick={() => onNavigate("puntos")}
              >
                OLFFY Puntos
              </button>
            </div>
          </div>

          <div className={styles.newsletterCol}>
            <h3 className={styles.colTitle}>Newsletter</h3>
            <p>Envíos a todo Chile · Retiro en tienda</p>
            <NewsletterForm onSubscribe={onSubscribe} />
          </div>
        </div>

        <div className={styles.bottomBar}>
          <span>© {COPYRIGHT_YEAR} OLFFY. Todos los derechos reservados.</span>
          <span className={styles.credit}>Hecho por Mouselabs</span>
        </div>
      </div>
    </footer>
  );
}
