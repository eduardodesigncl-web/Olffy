import type { PublicPage } from "../layout";
import styles from "./FeaturedCollection.module.css";

interface FeaturedCollectionProps {
  onNavigate: (page: PublicPage) => void;
}

// Banner de "nueva colección": la foto cubre todo el ancho como fondo y el
// texto va encima sobre un degradado que asegura la legibilidad.
export function FeaturedCollection({ onNavigate }: FeaturedCollectionProps) {
  return (
    <section className={styles.section} aria-labelledby="collection-title">
      <img
        className={styles.bg}
        src="/olffy/banners/nuevos-lanzamientos.webp"
        alt="Nueva colección de papelería OLFFY: cuadernos ilustrados y detalles en una tote bag de la marca."
        loading="lazy"
      />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.eyebrow}>NUEVA COLECCIÓN</span>
        <h2 id="collection-title" className={styles.title}>
          Papelería para empezar algo bonito
        </h2>
        <p className={styles.text}>
          Una selección pensada para ordenar tus días con estilo: cuadernos
          ilustrados, planners y detalles que hacen más linda cada rutina.
        </p>
        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => onNavigate("tienda")}
          >
            Ver la colección
          </button>
          <button
            type="button"
            className={styles.ctaGhost}
            onClick={() => onNavigate("novedades")}
          >
            Ver novedades
          </button>
        </div>
      </div>
    </section>
  );
}
