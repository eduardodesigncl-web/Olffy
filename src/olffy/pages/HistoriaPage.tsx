import { GiftIcon, type GiftIconName } from '../components/storefront';
import { Flower, Sparkle, Squiggle } from '../components/home/HomeDecor';
import { InstagramFeed } from '../components/home';
import { StoreLocation } from '../components/history';
import type { PublicPage } from '../components/layout';
import styles from './HistoriaPage.module.css';

interface HistoriaPageProps {
  onNavigate?: (page: PublicPage) => void;
}

const IG_URL = 'https://instagram.com/olffy.papeleria';
const TIKTOK_URL = 'https://tiktok.com/@olffy.papeleria';

// Foto editorial del hero (opcional). Colócala en public/images/ y activa la
// imagen real; mientras no exista, se muestra la composición mock de marca.
const HERO_IMAGE: string | undefined = undefined;

// Fotos "Cómo nació" (scrapbook) — placeholders listos para reemplazar.
const ORIGIN_PHOTOS: { icon: GiftIconName; bg: string; tilt: string }[] = [
  { icon: 'palette', bg: '#DEDDF2', tilt: '-4deg' },
  { icon: 'notebook', bg: '#FFE9A8', tilt: '3deg' },
  { icon: 'heart', bg: '#FBD4C2', tilt: '-2deg' },
];

const PROCESS: { n: string; icon: GiftIconName; title: string; text: string; accent: string }[] = [
  { n: '01', icon: 'bulb', title: 'Inspiración', text: 'Todo nace de una idea creativa inspirada en la vida cotidiana, la naturaleza, los colores y los pequeños detalles.', accent: 'var(--olffy-amarillo)' },
  { n: '02', icon: 'pen', title: 'Ilustración', text: 'Cada diseño se ilustra a mano, cuidando la personalidad de OLFFY y su paleta de colores.', accent: 'var(--olffy-morado)' },
  { n: '03', icon: 'palette', title: 'Diseño', text: 'Las ilustraciones toman forma en cuadernos, planners, stickers y piezas de papelería pensadas para usarse de verdad.', accent: 'var(--olffy-naranjo)' },
  { n: '04', icon: 'ruler', title: 'Producción', text: 'Trabajamos cada producto con atención al detalle para que sea bonito, útil y duradero.', accent: '#2e7d32' },
  { n: '05', icon: 'package', title: 'Empaque', text: 'Preparamos cada pedido con cariño, listo para regalar o acompañar tu rutina.', accent: '#c8901a' },
];

// Nombres placeholder (no confirmados) — reemplazar por reales + fotos.
// `image` opcional: al agregar la foto real se muestra en vez del placeholder.
const TEAM: { name: string; role: string; desc: string; icon: GiftIconName; bg: string; grad: string; accent: string; image?: string }[] = [
  { name: 'Fundadora OLFFY', role: 'Fundadora y dirección de marca', desc: 'Guía el universo OLFFY, las colecciones, la tienda y cada detalle de la experiencia.', icon: 'star', bg: '#FFE9A8', grad: '#FFD37A', accent: '#c8901a' },
  { name: 'Ilustradora OLFFY', role: 'Ilustración y desarrollo visual', desc: 'Transforma ideas, colores y detalles cotidianos en ilustraciones para productos de papelería.', icon: 'palette', bg: '#DEDDF2', grad: '#C9C7EC', accent: 'var(--olffy-morado)' },
  { name: 'Ilustrador OLFFY', role: 'Ilustración y piezas gráficas', desc: 'Aporta nuevas miradas al mundo visual de OLFFY y a las colecciones ilustradas.', icon: 'pen', bg: '#FBD4C2', grad: '#F2B79E', accent: 'var(--olffy-naranjo)' },
  { name: 'Diseño OLFFY', role: 'Diseño y producción gráfica', desc: 'Apoya la adaptación de ilustraciones a productos, formatos, empaques y piezas digitales.', icon: 'ruler', bg: '#D8ECD9', grad: '#B8DEBB', accent: '#2e7d32' },
];

function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TiktokGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2 1.5 3.4 3.5 3.7v2.6c-1.3 0-2.5-.3-3.5-.9v5.9a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V3h2.7z" />
    </svg>
  );
}

// Página "Nuestra historia" — editorial: hero, cómo nació, proceso, equipo,
// tienda + mapa, galería y cierre de comunidad. Estática (sin estado propio).
export function HistoriaPage({ onNavigate }: HistoriaPageProps) {
  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <Blob />
        <Sparkle className={`${styles.deco} ${styles.heroSparkle}`} color="var(--olffy-amarillo)" size={24} />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>SOBRE NOSOTROS</span>
            <h1 className={styles.heroTitle}>La historia detrás de OLFFY</h1>
            <p className={styles.heroSubtitle}>
              Papelería ilustrada nacida en Viña del Mar con mucho amor, creatividad y un perrito
              llamado Olffy.
            </p>
          </div>
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroFrame}>
              {HERO_IMAGE ? (
                <img className={styles.heroImg} src={HERO_IMAGE} alt="El taller de OLFFY en Viña del Mar" />
              ) : (
                <div className={styles.heroPlaceholder}>
                  <GiftIcon name="palette" size={54} color="var(--olffy-morado)" />
                  <span className={styles.heroPlaceholderTag}>el mundo OLFFY</span>
                </div>
              )}
            </div>
            <Flower className={`${styles.deco} ${styles.heroFlower}`} color="var(--olffy-naranjo)" size={66} />
          </div>
        </div>
      </section>

      {/* ── Cómo nació OLFFY ── */}
      <section className={`${styles.section} ${styles.originSection}`}>
        <div className={styles.originRow}>
          <div className={styles.originText}>
            <span className={styles.sectionEyebrow}>NUESTRO ORIGEN</span>
            <h2 className={styles.sectionTitle}>Cómo nació OLFFY</h2>
            <Squiggle className={styles.squiggle} color="var(--olffy-naranjo)" size={120} />
            <p className={styles.paragraph}>
              OLFFY nació de las ganas de convertir ilustraciones hechas a mano en cuadernos,
              planners y papelería que acompañen tu día a día. Creamos un mundo donde ser una persona
              creativa, ordenada o soñadora se puede sentir bonito, útil y cercano.
            </p>
          </div>
          <div className={styles.originPhotos} aria-hidden="true">
            {ORIGIN_PHOTOS.map((p, i) => (
              <div key={i} className={styles.originPhoto} style={{ background: p.bg, transform: `rotate(${p.tilt})` }}>
                <GiftIcon name={p.icon} size={34} color="rgba(42,28,16,0.34)" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proceso de creación ── */}
      <section className={styles.processSection}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>PASO A PASO</span>
          <h2 className={styles.sectionTitle}>Proceso de creación</h2>
        </div>
        <div className={styles.processGrid}>
          {PROCESS.map((step) => (
            <article key={step.n} className={styles.processCard}>
              <span className={styles.processNum} style={{ color: step.accent }}>{step.n}</span>
              <span className={styles.processIcon} style={{ background: step.accent }}>
                <GiftIcon name={step.icon} size={20} color="#fff" />
              </span>
              <h3 className={styles.processTitle}>{step.title}</h3>
              <p className={styles.processText}>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Personas detrás de OLFFY ── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionEyebrow}>EL EQUIPO</span>
          <h2 className={styles.sectionTitle}>Las personas detrás de OLFFY</h2>
          <p className={styles.sectionSub}>
            Detrás de cada producto hay ilustración, diseño, producción y mucho cariño.
          </p>
        </div>
        <div className={styles.teamGrid}>
          {TEAM.map((member) => (
            <article key={member.name} className={styles.teamCard}>
              {/* Foto grande (placeholder listo para imagen real). */}
              <div
                className={styles.teamPhoto}
                style={member.image ? undefined : { background: `linear-gradient(150deg, ${member.bg}, ${member.grad})` }}
              >
                {member.image ? (
                  <img className={styles.teamImg} src={member.image} alt={member.name} loading="lazy" />
                ) : (
                  <span className={styles.teamPhotoIcon} aria-hidden="true">
                    <GiftIcon name={member.icon} size={54} color={member.accent} />
                  </span>
                )}
              </div>
              {/* Mini card flotante inferior. */}
              <div className={styles.teamPanel}>
                <span className={styles.teamRole} style={{ color: member.accent }}>{member.role}</span>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamDesc}>{member.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Nuestra tienda ── */}
      <section className={styles.storeSection}>
        <StoreLocation onGoToTienda={onNavigate ? () => onNavigate('tienda') : undefined} />
      </section>

      {/* ── Instagram (reutilizado desde Home) ── */}
      <InstagramFeed />

      {/* ── Comunidad (cierre) ── */}
      <section className={styles.communitySection}>
        <Sparkle className={`${styles.deco} ${styles.commSparkleA}`} color="var(--olffy-amarillo)" size={22} />
        <Sparkle className={`${styles.deco} ${styles.commSparkleB}`} color="rgba(255,255,255,0.5)" size={16} />
        <div className={styles.communityInner}>
          <h2 className={styles.communityTitle}>Únete a la comunidad OLFFY</h2>
          <p className={styles.communityText}>
            Síguenos en redes sociales para ver nuevos lanzamientos, procesos creativos, sorteos y
            muchas ideas bonitas.
          </p>
          <div className={styles.communityActions}>
            <a className={styles.socialBtn} href={IG_URL} target="_blank" rel="noopener noreferrer">
              <InstagramGlyph size={18} />
              Instagram
            </a>
            <a className={styles.socialBtn} href={TIKTOK_URL} target="_blank" rel="noopener noreferrer">
              <TiktokGlyph size={18} />
              TikTok
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// Blob decorativo del hero (color suave).
function Blob() {
  return (
    <span className={`${styles.deco} ${styles.heroBlob}`} aria-hidden="true" />
  );
}
