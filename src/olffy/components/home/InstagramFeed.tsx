import { useState } from 'react';
import { Modal } from '../ui';
import { GiftIcon, type GiftIconName } from '../storefront';
import styles from './InstagramFeed.module.css';
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_LINK } from '../../config/social';

// Feed de Instagram simulado (sin API real). Los posts son piezas visuales
// internas; al abrir uno se muestra un modal editorial inspirado en IG.
interface IgPost {
  id: number;
  grad: [string, string];
  icon: GiftIconName;
  theme: string;
  caption: string;
  date: string;
  likes: number;
}

const POSTS: IgPost[] = [
  {
    id: 1,
    grad: ['#FFE9A8', '#FBD4C2'],
    icon: 'notebook',
    theme: 'Producto',
    caption: 'Nueva colección de cuadernos ilustrados para inspirar tus días creativos. ¿Cuál se viene a tu escritorio?',
    date: '3 de julio',
    likes: 428,
  },
  {
    id: 2,
    grad: ['#DEDDF2', '#C9C7EC'],
    icon: 'sticker',
    theme: 'Papelería',
    caption: 'Stickers florales hechos a mano en Viña del Mar, listos para decorar cuadernos, laptops y todo lo que se te ocurra.',
    date: '1 de julio',
    likes: 512,
  },
  {
    id: 3,
    grad: ['#FBD4C2', '#F2E0CC'],
    icon: 'calendar',
    theme: 'Lifestyle',
    caption: 'Planifica tu mes con estilo: nuestros planners favoritos ya están de vuelta y en tonos pastel.',
    date: '27 de junio',
    likes: 361,
  },
  {
    id: 4,
    grad: ['#FFF1CE', '#FFE0A0'],
    icon: 'heart',
    theme: 'Detrás de escena',
    caption: 'Gracias por ser parte de la comunidad OLFFY. Cada pedido se empaca a mano y con muchísimo cariño.',
    date: '24 de junio',
    likes: 640,
  },
  {
    id: 5,
    grad: ['#DEDDF2', '#FBD4C2'],
    icon: 'users',
    theme: 'Comunidad',
    caption: 'Nos encanta ver cómo usan su papelería OLFFY. Etiquétanos y aparece en nuestro feed.',
    date: '20 de junio',
    likes: 287,
  },
  {
    id: 6,
    grad: ['#FFE9A8', '#FFD37A'],
    icon: 'sparkles',
    theme: 'Novedades',
    caption: 'Se vienen lanzamientos nuevos este mes. Activa las notificaciones para no perderte nada.',
    date: '16 de junio',
    likes: 733,
  },
];

function InstagramGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function HeartGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7-4.35-9.5-8.5C.8 9.6 2.3 6 5.5 6c2 0 3.3 1.2 4.1 2.3C10.4 7.2 11.7 6 13.7 6c3.2 0 4.7 3.6 3 6.5C18.2 16.65 12 21 12 21z" />
    </svg>
  );
}

export function InstagramFeed() {
  const [active, setActive] = useState<IgPost | null>(null);

  return (
    <section className={styles.section} aria-labelledby="ig-title">
      <div className={styles.layout}>
        {/* Izquierda: grilla 2x3 de posts. */}
        <div className={styles.grid}>
          {POSTS.map((post) => (
            <button
              key={post.id}
              type="button"
              className={styles.post}
              style={{ backgroundImage: `linear-gradient(140deg, ${post.grad[0]}, ${post.grad[1]})` }}
              onClick={() => setActive(post)}
              aria-label={`Ver publicación: ${post.caption}`}
            >
              <span className={styles.postTheme}>{post.theme}</span>
              <span className={styles.postIcon} aria-hidden="true">
                <GiftIcon name={post.icon} size={38} color="rgba(42,28,16,0.30)" />
              </span>
              <span className={styles.postOverlay} aria-hidden="true">
                <span className={styles.overlayLikes}>
                  <HeartGlyph size={15} />
                  {post.likes}
                </span>
                <span className={styles.overlayCta}>Ver post</span>
              </span>
            </button>
          ))}
        </div>

        {/* Derecha: contenido textual. */}
        <div className={styles.info}>
          <span className={styles.igIcon}>
            <InstagramGlyph size={24} />
          </span>
          <h2 id="ig-title" className={styles.title}>
            Síguenos en Instagram
          </h2>
          <p className={styles.subtitle}>
            Ideas creativas, novedades y el detrás de escena de OLFFY, todos los días.
          </p>
          <a className={styles.handleBtn} href={INSTAGRAM_PROFILE_LINK} target="_blank" rel="noopener noreferrer me">
            <InstagramGlyph size={17} />
            @{INSTAGRAM_HANDLE}
          </a>
          <p className={styles.note}>Etiquétanos con #mundoOLFFY y aparece en nuestro feed.</p>
        </div>
      </div>

      <Modal isOpen={active !== null} onClose={() => setActive(null)} panelClassName={styles.modalPanel}>
        {active && (
          <div className={styles.modal}>
            <div className={styles.modalMedia} style={{ backgroundImage: `linear-gradient(140deg, ${active.grad[0]}, ${active.grad[1]})` }}>
              <GiftIcon name={active.icon} size={128} color="rgba(42,28,16,0.32)" />
              <span className={styles.modalTheme}>{active.theme}</span>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalAccount}>
                <span className={styles.modalAvatar}>O</span>
                <div>
                  <div className={styles.modalHandle}>@{INSTAGRAM_HANDLE}</div>
                  <div className={styles.modalMeta}>Papelería ilustrada · Viña del Mar</div>
                </div>
              </div>

              <p className={styles.modalCaption}>{active.caption}</p>

              <div className={styles.modalStats}>
                <span className={styles.modalLikes}>
                  <HeartGlyph size={15} />
                  {active.likes} me gusta
                </span>
                <span className={styles.modalDate}>{active.date}</span>
              </div>

              <a className={styles.modalCta} href={INSTAGRAM_PROFILE_LINK} target="_blank" rel="noopener noreferrer me">
                <InstagramGlyph size={16} />
                Ver en Instagram
              </a>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
