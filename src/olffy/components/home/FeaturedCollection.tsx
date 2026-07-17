import { GiftIcon } from '../storefront';
import type { PublicPage } from '../layout';
import { Flower, Sparkle, Squiggle } from './HomeDecor';
import styles from './FeaturedCollection.module.css';

interface FeaturedCollectionProps {
  onNavigate: (page: PublicPage) => void;
}

// Bloque editorial tipo "escena de campaña": texto + visual grande + decoración.
export function FeaturedCollection({ onNavigate }: FeaturedCollectionProps) {
  return (
    <section className={styles.section} aria-labelledby="collection-title">
      <div className={styles.inner}>
        <div className={styles.visualCol} aria-hidden="true">
          <div className={styles.scene}>
            <div className={`${styles.tile} ${styles.tileA}`}>
              <GiftIcon name="notebook" size={44} color="var(--olffy-morado)" />
            </div>
            <div className={`${styles.tile} ${styles.tileB}`}>
              <GiftIcon name="sticker" size={40} color="var(--olffy-naranjo)" />
            </div>
            <div className={`${styles.tile} ${styles.tileC}`}>
              <GiftIcon name="calendar" size={40} color="#c8901a" />
            </div>
            <Flower className={styles.sceneFlower} color="var(--olffy-naranjo)" size={78} />
            <Sparkle className={styles.sceneSparkle} color="var(--olffy-amarillo)" size={24} />
          </div>
        </div>

        <div className={styles.textCol}>
          <span className={styles.eyebrow}>NUEVA COLECCIÓN</span>
          <h2 id="collection-title" className={styles.title}>Papelería para empezar algo bonito</h2>
          <Squiggle className={styles.squiggle} color="var(--olffy-naranjo)" size={130} />
          <p className={styles.text}>
            Una selección pensada para ordenar tus días con estilo: cuadernos ilustrados, planners y
            detalles que hacen más linda cada rutina.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className={styles.ctaPrimary} onClick={() => onNavigate('tienda')}>
              Ver la colección
            </button>
            <button type="button" className={styles.ctaGhost} onClick={() => onNavigate('novedades')}>
              Ver novedades
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
