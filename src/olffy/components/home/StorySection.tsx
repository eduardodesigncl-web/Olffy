import { useState } from 'react';
import { GiftIcon, type GiftIconName } from '../storefront';
import type { PublicPage } from '../layout';
import { Flower, Sparkle, Squiggle } from './HomeDecor';
import styles from './StorySection.module.css';

interface StorySectionProps {
  onNavigate: (page: PublicPage) => void;
}

// Foto lifestyle de OLFFY. Colocar el archivo real en public/images/ y quedará
// activa automáticamente; mientras no exista, se muestra el fallback discreto.
const STORY_IMAGE_SRC = '/images/olffy-story.webp';

interface ValueStamp {
  icon: GiftIconName;
  label: string;
  detail: string;
  accent: string;
}

// Valores de marca como sellos/etiquetas integradas (no cards grandes).
const STAMPS: ValueStamp[] = [
  { icon: 'palette', label: 'Diseño ilustrado', detail: 'hecho a mano', accent: 'var(--olffy-naranjo)' },
  { icon: 'notebook', label: 'Papelería con propósito', detail: 'para crear y organizar', accent: 'var(--olffy-morado)' },
  { icon: 'heart', label: 'Hecho con amor', detail: 'desde Viña del Mar', accent: '#2e7d32' },
];

// Sección "Conoce OLFFY" como escena editorial: texto + foto grande + sellos.
export function StorySection({ onNavigate }: StorySectionProps) {
  const [imageOk, setImageOk] = useState(true);

  return (
    <section className={styles.section} aria-labelledby="story-title">
      {/* Decoración de fondo de la escena. */}
      <Sparkle className={`${styles.bgDeco} ${styles.bgSparkleA} ${styles.float}`} color="var(--olffy-amarillo)" size={24} />
      <Sparkle className={`${styles.bgDeco} ${styles.bgSparkleB} ${styles.floatSlow}`} color="var(--olffy-naranjo)" size={16} />

      <div className={styles.canvas}>
        {/* Columna de texto. */}
        <div className={styles.copy}>
          <span className={styles.eyebrow}>NUESTRA HISTORIA</span>
          <h2 id="story-title" className={styles.title}>Conoce OLFFY</h2>
          <Squiggle className={styles.squiggle} color="var(--olffy-naranjo)" size={128} />
          <p className={styles.text}>
            Descubre la historia detrás de OLFFY y cómo creamos productos únicos para organizar tu
            mundo con magia.
          </p>

          {/* Sellos de valores integrados. */}
          <ul className={styles.stamps}>
            {STAMPS.map((s) => (
              <li key={s.label} className={styles.stamp}>
                <span className={styles.stampIcon} style={{ color: s.accent }}>
                  <GiftIcon name={s.icon} size={18} color={s.accent} />
                </span>
                <span className={styles.stampText}>
                  <span className={styles.stampLabel}>{s.label}</span>
                  <span className={styles.stampDetail}>{s.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foto grande protagonista. */}
        <div className={styles.photoCol}>
          <div className={styles.photoFrame}>
            {imageOk ? (
              <img
                className={styles.photoImg}
                src={STORY_IMAGE_SRC}
                alt="El mundo de OLFFY: papelería ilustrada hecha a mano en Viña del Mar."
                loading="lazy"
                onError={() => setImageOk(false)}
              />
            ) : (
              <div className={styles.photoFallback} aria-hidden="true">
                <GiftIcon name="camera" size={40} color="rgba(42,28,16,0.28)" />
                <span className={styles.photoFallbackText}>OLFFY</span>
              </div>
            )}
          </div>
          <Flower className={`${styles.photoFlower} ${styles.floatSlow}`} color="var(--olffy-naranjo)" size={64} />
          <Sparkle className={`${styles.photoSparkle} ${styles.float}`} color="var(--olffy-amarillo)" size={20} />
        </div>

        {/* Acciones: CTA + frase de marca (bajo el texto en desktop, bajo la
            foto en mobile). */}
        <div className={styles.actions}>
          <button type="button" className={styles.cta} onClick={() => onNavigate('historia')}>
            Ver nuestra historia
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <span className={styles.frase}>
            <Sparkle className={styles.fraseSparkle} color="var(--olffy-amarillo)" size={14} />
            Hecho con amor y con las manos, claro
          </span>
        </div>
      </div>
    </section>
  );
}
