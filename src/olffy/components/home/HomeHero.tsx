import { GiftIcon } from '../storefront';
import type { PublicPage } from '../layout';
import { Flower, Sparkle, Blob } from './HomeDecor';
import styles from './HomeHero.module.css';

interface HomeHeroProps {
  onNavigate: (page: PublicPage) => void;
}

// Hero principal de la Home: bloque morado OLFFY con composición de marca y
// decoración flotante (respeta prefers-reduced-motion vía CSS).
export function HomeHero({ onNavigate }: HomeHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      {/* Decoración de fondo. */}
      <Blob className={`${styles.blob} ${styles.blobOne}`} color="rgba(255,255,255,0.06)" size={420} />
      <Blob className={`${styles.blob} ${styles.blobTwo}`} color="rgba(255,233,168,0.12)" size={320} />
      <Sparkle className={`${styles.deco} ${styles.sparkleA} ${styles.float}`} color="var(--olffy-amarillo)" size={28} />
      <Sparkle className={`${styles.deco} ${styles.sparkleB} ${styles.floatSlow}`} color="rgba(255,255,255,0.5)" size={18} />
      <Flower className={`${styles.deco} ${styles.flowerA} ${styles.floatSlow}`} color="var(--olffy-naranjo)" size={70} />

      <div className={styles.inner}>
        <div className={styles.textCol}>
          <span className={styles.eyebrow}>PAPELERÍA ILUSTRADA · HECHA A MANO</span>
          <h1 id="hero-title" className={styles.title}>
            Papelería ilustrada para escribir, regalar y hacer más linda tu rutina
          </h1>
          <p className={styles.subtitle}>
            Cuadernos, planners, stickers y detalles creativos hechos para acompañar tus ideas todos
            los días.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className={styles.ctaPrimary} onClick={() => onNavigate('tienda')}>
              Ver tienda
            </button>
            <button type="button" className={styles.ctaSecondary} onClick={() => onNavigate('novedades')}>
              Ver novedades
            </button>
          </div>
        </div>

        {/* Composición visual de marca (no un placeholder vacío). */}
        <div className={styles.visualCol} aria-hidden="true">
          <div className={`${styles.card} ${styles.cardBack}`} />
          <div className={styles.card}>
            <Flower className={`${styles.cardFlower} ${styles.float}`} color="var(--olffy-naranjo)" size={92} />
            <div className={styles.cardIcon}>
              <GiftIcon name="notebook" size={54} color="var(--olffy-morado)" />
            </div>
            <span className={styles.cardTag}>hola, ideas bonitas</span>
            <Sparkle className={`${styles.cardSparkle} ${styles.floatSlow}`} color="var(--olffy-amarillo)" size={26} />
          </div>
        </div>
      </div>
    </section>
  );
}
