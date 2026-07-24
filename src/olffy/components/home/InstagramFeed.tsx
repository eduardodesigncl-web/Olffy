import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui";
import styles from "./InstagramFeed.module.css";
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_LINK } from "../../config/social";

// Feed de Instagram con los reels reales de la marca. Los posts son piezas
// de video; al abrir uno se muestra un modal editorial inspirado en IG con
// el video completo y su descripción.
interface IgPost {
  id: number;
  src: string;
  theme: string;
  caption: string;
}

const POSTS: IgPost[] = [
  {
    id: 1,
    src: "/olffy/instagram/ig-1.mp4",
    theme: "Detrás de escena",
    caption:
      "A veces me preguntan por qué somos tan detallista y es porque siento que no hay segunda oportunidad, para causar una buena primera impresión.\n\nAbrir, limpiar, sacar el polvo, ordenar todo, preocuparme de que huela rico, que se vea bonito… para mí también es una forma de darle amor a la marca, al proyecto. Es una forma de alimentar mi amor por el proceso.\n\nPorque no se trata solo de vender cosas lindas, se trata de que cada persona que entre sienta el cariño con el que hacemos todo.",
  },
  {
    id: 2,
    src: "/olffy/instagram/ig-2.mp4",
    theme: "Nuestra historia",
    caption:
      "Hace 6 años, Olffy era solo una idea.\nHoy, es una marca construida con creatividad, aprendizaje y muchas personas que confiaron en nosotros desde el comienzo. 🤍\n\nDetrás de cada diseño, cada empaque y cada detalle, hay una historia real de esfuerzo, crecimiento y pasión por crear algo diferente. ✍🏻✨\n\nEste video es para quienes sueñan con empezar algo propio, para quienes valoran los detalles y para quienes creen que una marca puede transmitir emociones, no solo vender productos.\n\nGracias por ser parte de este proceso.\nY si recién estás llegando… bienvenido a @olffy.cl 🫶🏻\n\n📍Papelería creativa, detalles personalizados y diseño con identidad.\n\n#chile #creatividad #original #crear #conectar",
  },
  {
    id: 3,
    src: "/olffy/instagram/ig-3.mp4",
    theme: "Cómo empezó",
    caption:
      "No empezó con un logo.\nEmpezó con una idea, muchas dudas y las ganas de crear algo distinto.\n\nEste es solo el comienzo de una historia que todavía se sigue escribiendo. ✍🏻✨\n\nPronto les mostraremos cómo nació @olffy.cl, todo lo que hubo detrás y cómo fuimos construyendo lo que hoy ven en pantalla.\n\nPorque a veces, las mejores marcas no nacen perfectas… se forman con tiempo, errores, aprendizaje y personas que creen en el proceso. 🤍",
  },
  {
    id: 4,
    src: "/olffy/instagram/ig-4.mp4",
    theme: "Oliver & Luffy",
    caption:
      "Esto comenzó como una idea en la mesa, entre lápices, café y risas ☕🎨\n\n¿Qué pasaría si Oliver y Luffy vivieran los cuentos que nos acompañaron cuando éramos niños?\n\nBueno… la historia va así:\n\nDicen que todo empezó cuando Oliver le pidió un deseo a Luffy…\nY Luffy, con su corazón enorme (y cero precisión 😅), lo cumplió a su manera.\n\nPum ✨\nTerminaron dentro de los cuentos clásicos.\n\nPor eso los verás ahí…\nsiendo un personaje más en cada historia 🌙📖\n\nAhora este proyecto está tomando vida 💛\nPronto podrás pintarlo tú también. 🐾✨",
  },
  {
    id: 5,
    src: "/olffy/instagram/ig-5.mp4",
    theme: "Inspiración",
    caption:
      "Las ideas que plasmas en una hoja son como semillas en un jardín: cada trazo que dibujas y cada palabra que escribes tienen el potencial de florecer en algo grandioso. Esas hojas en blanco esperan ansiosas ser llenadas con tu creatividad, tus sueños y tus reflexiones.\n\n¡No subestimes el poder de lo que plasmas en una hoja! 💡🤎",
  },
  {
    id: 6,
    src: "/olffy/instagram/ig-6.mp4",
    theme: "Novedades",
    caption: "EN PROCESO . . . . ⚙️🤎✨️",
  },
];

function InstagramGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlayGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// Isotipo OLFFY: florcita de 5 pétalos (ámbar) sobre círculo morado, con los
// colores de marca. Se usa como avatar de la cuenta en las publicaciones.
function OlffyIsotype({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      role="img"
    >
      <circle cx="20" cy="20" r="20" fill="var(--olffy-morado)" />
      <g fill="var(--olffy-amarillo)">
        <circle cx="20" cy="12.8" r="7" />
        <circle cx="26.85" cy="17.78" r="7" />
        <circle cx="24.23" cy="25.83" r="7" />
        <circle cx="15.77" cy="25.83" r="7" />
        <circle cx="13.15" cy="17.78" r="7" />
        <circle cx="20" cy="20" r="7" />
      </g>
    </svg>
  );
}

// Miniatura de video para la grilla: se reproduce (silenciada) al pasar el
// cursor o al enfocar con teclado, y se pausa al salir.
function PostThumb({ post, onOpen }: { post: IgPost; onOpen: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Fotograma de portada: algunos reels abren con un fundido en negro, así que
  // usamos un cuadro a ~1/4 del video como miniatura representativa.
  const posterTimeRef = useRef(0);

  const showPoster = () => {
    const v = videoRef.current;
    if (v) v.currentTime = posterTimeRef.current;
  };
  const play = () => {
    const v = videoRef.current;
    if (v) void v.play().catch(() => {});
  };
  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      showPoster();
    }
  };

  return (
    <button
      type="button"
      className={styles.post}
      onClick={onOpen}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      aria-label={`Ver publicación: ${post.theme}`}
    >
      <video
        ref={videoRef}
        className={styles.postVideo}
        src={post.src}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (Number.isFinite(v.duration) && v.duration > 0) {
            posterTimeRef.current = Math.min(v.duration * 0.25, 2);
            v.currentTime = posterTimeRef.current;
          }
        }}
      />
      <span className={styles.postTheme}>{post.theme}</span>
      <span className={styles.postReel} aria-hidden="true">
        <PlayGlyph size={13} />
      </span>
      <span className={styles.postOverlay} aria-hidden="true">
        <span className={styles.overlayPlay}>
          <PlayGlyph size={20} />
        </span>
        <span className={styles.overlayCta}>Ver post</span>
      </span>
    </button>
  );
}

export function InstagramFeed() {
  const [active, setActive] = useState<IgPost | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Al abrir el modal, arranca el video CON audio. El modal se abre por un clic
  // del usuario, así que la reproducción con sonido está permitida. Si algún
  // navegador lo bloquea, el usuario puede darle play con los controles.
  useEffect(() => {
    const v = modalVideoRef.current;
    if (active && v) {
      v.muted = false;
      v.volume = 1;
      void v.play().catch(() => {});
    }
  }, [active]);

  return (
    <section className={styles.section} aria-labelledby="ig-title">
      <div className={styles.layout}>
        {/* Izquierda: grilla 2x3 de posts. */}
        <div className={styles.grid}>
          {POSTS.map((post) => (
            <PostThumb
              key={post.id}
              post={post}
              onOpen={() => setActive(post)}
            />
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
            Ideas creativas, novedades y el detrás de escena de OLFFY, todos los
            días.
          </p>
          <a
            className={styles.handleBtn}
            href={INSTAGRAM_PROFILE_LINK}
            target="_blank"
            rel="noopener noreferrer me"
          >
            <InstagramGlyph size={17} />@{INSTAGRAM_HANDLE}
          </a>
          <p className={styles.note}>
            Etiquétanos con #mundoOLFFY y aparece en nuestro feed.
          </p>
        </div>
      </div>

      <Modal
        isOpen={active !== null}
        onClose={() => setActive(null)}
        panelClassName={styles.modalPanel}
      >
        {active && (
          <div className={styles.modal}>
            <div className={styles.modalMedia}>
              <video
                ref={modalVideoRef}
                className={styles.modalVideo}
                src={active.src}
                controls
                autoPlay
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => {
                  // Vertical llena el espacio (cover); horizontal se ajusta
                  // completo (contain) para no recortarse.
                  const v = e.currentTarget;
                  v.style.objectFit =
                    v.videoWidth > v.videoHeight ? "contain" : "cover";
                }}
              />
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalAccount}>
                <span className={styles.modalAvatar}>
                  <OlffyIsotype size={44} />
                </span>
                <div>
                  <div className={styles.modalHandle}>@{INSTAGRAM_HANDLE}</div>
                  <div className={styles.modalMeta}>
                    Papelería ilustrada · Viña del Mar
                  </div>
                </div>
              </div>

              <p className={styles.modalCaption}>{active.caption}</p>

              <a
                className={styles.modalCta}
                href={INSTAGRAM_PROFILE_LINK}
                target="_blank"
                rel="noopener noreferrer me"
              >
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
