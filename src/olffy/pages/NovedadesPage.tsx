import { useEffect, useState, type FormEvent } from "react";
import { GiftIcon, type GiftIconName } from "../components/storefront";
import { Flower, Sparkle } from "../components/home/HomeDecor";
import { Reveal } from "../components/home";
import { ProductGrid } from "../components/product";
import type { PublicPage } from "../components/layout";
import type { Product } from "../types";
import styles from "./NovedadesPage.module.css";

interface NovedadesPageProps {
  newProducts: Product[]; // productos con tag "Nuevo" (o los más recientes)
  onProductClick: (product: Product) => void;
  onNavigate: (page: PublicPage) => void;
  onNotify?: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// Fecha mock del próximo drop. Si ya pasó, se muestra el estado "disponible".
const NEXT_DROP_DATE = new Date("2026-08-15T12:00:00");

// Colecciones nuevas — mock editorial con visual, chip de estado y CTA.
const COLLECTIONS: {
  title: string;
  count: string;
  desc: string;
  chip: string;
  icon: GiftIconName;
  bg: string;
  grad: string;
  accent: string;
}[] = [
  {
    title: "Colección Primavera",
    count: "12 productos",
    desc: "Flores, colores suaves y papelería para empezar de nuevo.",
    chip: "Nuevo",
    icon: "notebook",
    bg: "#FFE9A8",
    grad: "#FFD37A",
    accent: "#c8901a",
  },
  {
    title: "Edición Violeta",
    count: "8 productos",
    desc: "La paleta lila de OLFFY en cuadernos, stickers y planners.",
    chip: "Limitado",
    icon: "palette",
    bg: "#DEDDF2",
    grad: "#C9C7EC",
    accent: "var(--olffy-morado)",
  },
  {
    title: "Kits Regalo 2026",
    count: "5 nuevos kits",
    desc: "Combinaciones listas para sorprender a quien más quieres.",
    chip: "Pronto",
    icon: "gift",
    bg: "#FBD4C2",
    grad: "#F2B79E",
    accent: "var(--olffy-naranjo)",
  },
];

// Calendario de lanzamientos — timeline mock.
const TIMELINE: {
  when: string;
  what: string;
  status: "nuevo" | "pronto" | "prep";
  icon: GiftIconName;
}[] = [
  {
    when: "Esta semana",
    what: "Nuevos stickers ilustrados",
    status: "nuevo",
    icon: "sticker",
  },
  {
    when: "Próximamente",
    what: "Planner edición especial",
    status: "pronto",
    icon: "notebook",
  },
  {
    when: "Muy pronto",
    what: "Kits de regalo",
    status: "pronto",
    icon: "gift",
  },
  {
    when: "En preparación",
    what: "Nueva colección de papelería",
    status: "prep",
    icon: "palette",
  },
];

const STATUS_LABEL: Record<"nuevo" | "pronto" | "prep", string> = {
  nuevo: "Nuevo",
  pronto: "Pronto",
  prep: "En preparación",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getTimeLeft(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
    secs: pad(Math.floor((diff % 60000) / 1000)),
  };
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Página de Novedades — experiencia de lanzamiento: hero, sneak peek con
// pista revelable, countdown del próximo drop, recién llegados, colecciones
// editoriales, calendario de lanzamientos y aviso por correo (todo mock).
export function NovedadesPage({
  newProducts,
  onProductClick,
  onNavigate,
  onNotify,
}: NovedadesPageProps) {
  const [peekRevealed, setPeekRevealed] = useState(false);
  // La hora no se puede leer durante el prerender: el countdown parte con un
  // placeholder estático y se calcula al hidratar (luego cada segundo).
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>({
    days: "--",
    hours: "--",
    mins: "--",
    secs: "--",
  });
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setTimeLeft(getTimeLeft(NEXT_DROP_DATE.getTime()));
    const timer = setInterval(
      () => setTimeLeft(getTimeLeft(NEXT_DROP_DATE.getTime())),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const handleNotify = (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    // Suscripción real (newsletter/Klaviyo) cuando la integración la provee;
    // el estado "enviado" se muestra de inmediato para no bloquear la UI.
    void onNotify?.(email.trim());
    setEmailSent(true);
  };

  return (
    <div className={styles.page}>
      {/* ── Hero completo ── */}
      <section className={styles.hero}>
        <Flower
          className={`${styles.deco} ${styles.heroFlower}`}
          color="var(--olffy-naranjo)"
          size={62}
        />
        <Sparkle
          className={`${styles.deco} ${styles.heroSparkleA}`}
          color="var(--olffy-amarillo)"
          size={22}
        />
        <Sparkle
          className={`${styles.deco} ${styles.heroSparkleB}`}
          color="var(--olffy-morado)"
          size={15}
        />

        <div className={styles.heroInner}>
          <span className={styles.heroSticker}>
            <GiftIcon name="sparkles" size={13} />
            Recién salido del taller
          </span>
          <span className={styles.eyebrow}>NOVEDADES OLFFY</span>
          <h1 className={styles.heroTitle}>Lo nuevo está por llegar</h1>
          <p className={styles.heroSubtitle}>
            Descubre colecciones, productos recién llegados y pequeños adelantos
            del mundo OLFFY.
          </p>
        </div>
      </section>

      <div className={styles.wrap}>
        {/* ── Sneak peek + countdown (sección protagonista del drop) ── */}
        <Reveal>
          <section className={styles.dropSection}>
            <span
              aria-hidden="true"
              className={`${styles.dropBlob} ${styles.dropBlobA}`}
            />
            <span
              aria-hidden="true"
              className={`${styles.dropBlob} ${styles.dropBlobB}`}
            />

            <div className={styles.dropGrid}>
              {/* Card misteriosa: hover en desktop, click/tap en cualquier lado. */}
              <button
                type="button"
                className={`${styles.peekCard} ${peekRevealed ? styles.peekRevealed : ""}`}
                onClick={() => setPeekRevealed((v) => !v)}
                aria-pressed={peekRevealed}
              >
                <span className={styles.peekBadge}>Sneak peek</span>

                <span className={styles.peekHidden} aria-hidden={peekRevealed}>
                  <span className={styles.peekMystery}>
                    <GiftIcon
                      name="notebook"
                      size={34}
                      color="rgba(255,255,255,0.55)"
                    />
                    <GiftIcon
                      name="sticker"
                      size={26}
                      color="rgba(255,255,255,0.4)"
                    />
                    <GiftIcon
                      name="pen"
                      size={30}
                      color="rgba(255,255,255,0.5)"
                    />
                  </span>
                  <span className={styles.peekQuestion}>Colección secreta</span>
                  <span className={styles.peekHint}>
                    Pasa el cursor o toca para ver una pista
                  </span>
                </span>

                <span className={styles.peekReveal} aria-hidden={!peekRevealed}>
                  <Sparkle
                    className={styles.peekSparkle}
                    color="var(--olffy-amarillo)"
                    size={20}
                  />
                  <span className={styles.peekRevealTag}>Una pista...</span>
                  <span className={styles.peekRevealTitle}>
                    Nueva colección de planners ilustrados
                  </span>
                  <span className={styles.peekRevealNote}>
                    Pronto en OLFFY. No podemos contar más todavía.
                  </span>
                </span>
              </button>

              {/* Countdown editorial del próximo drop. */}
              <div className={styles.countCol}>
                <span className={styles.countEyebrow}>
                  <GiftIcon name="clock" size={14} />
                  Próxima colección en camino
                </span>
                <h2 className={styles.countTitle}>
                  {timeLeft
                    ? "Cuenta regresiva para el nuevo drop"
                    : "La nueva colección ya está disponible"}
                </h2>
                <p className={styles.countText}>
                  {timeLeft
                    ? "Cuenta regresiva para descubrir el nuevo drop OLFFY."
                    : "Ya puedes encontrarla en la tienda junto a todos los recién llegados."}
                </p>

                {timeLeft ? (
                  <div className={styles.countUnits}>
                    {[
                      { value: timeLeft.days, label: "Días" },
                      { value: timeLeft.hours, label: "Horas" },
                      { value: timeLeft.mins, label: "Min" },
                      { value: timeLeft.secs, label: "Seg" },
                    ].map((u) => (
                      <span key={u.label} className={styles.countUnit}>
                        <span className={styles.countValue}>{u.value}</span>
                        <span className={styles.countLabel}>{u.label}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.countCta}
                    onClick={() => onNavigate("tienda")}
                  >
                    Ir a la tienda
                  </button>
                )}
              </div>
            </div>
          </section>
        </Reveal>

        {/* ── Recién llegados ── */}
        <section className={styles.section}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>YA EN TIENDA</span>
              <h2 className={styles.sectionTitle}>Recién llegados</h2>
              <p className={styles.sectionSub}>
                Productos que acaban de llegar a la tienda.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <ProductGrid
              products={newProducts.slice(0, 4)}
              onProductClick={onProductClick}
              variant="duo"
            />
          </Reveal>
        </section>

        {/* ── Colecciones nuevas ── */}
        <section className={styles.section}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>COLECCIONES</span>
              <h2 className={styles.sectionTitle}>
                Colecciones para mirar de cerca
              </h2>
            </div>
          </Reveal>
          <div className={styles.collectionsGrid}>
            {COLLECTIONS.slice(0, 4).map((c, i) => (
              <Reveal key={c.title} delay={i * 90}>
                <article
                  className={styles.collectionCard}
                  onClick={() => onNavigate("tienda")}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNavigate("tienda");
                    }
                  }}
                >
                  <div
                    className={styles.collectionVisual}
                    style={{
                      background: `linear-gradient(150deg, ${c.bg}, ${c.grad})`,
                    }}
                  >
                    <span className={styles.collectionChip}>{c.chip}</span>
                    <GiftIcon name={c.icon} size={46} color={c.accent} />
                  </div>
                  <div className={styles.collectionBody}>
                    <span
                      className={styles.collectionCount}
                      style={{ color: c.accent }}
                    >
                      {c.count}
                    </span>
                    <h3 className={styles.collectionTitle}>{c.title}</h3>
                    <p className={styles.collectionDesc}>{c.desc}</p>
                    <span className={styles.collectionCta}>
                      Ver colección
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Calendario de lanzamientos ── */}
        <section className={styles.section}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.sectionEyebrow}>LO QUE VIENE</span>
              <h2 className={styles.sectionTitle}>
                Calendario de lanzamientos
              </h2>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <ol className={styles.timeline}>
              {TIMELINE.map((item) => (
                <li key={item.what} className={styles.timelineItem}>
                  <span className={styles.timelineDot}>
                    <GiftIcon
                      name={item.icon}
                      size={17}
                      color="var(--olffy-morado)"
                    />
                  </span>
                  <div className={styles.timelineBody}>
                    <span
                      className={`${styles.timelineChip} ${styles[`chip_${item.status}`]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                    <span className={styles.timelineWhen}>{item.when}</span>
                    <span className={styles.timelineWhat}>{item.what}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* ── Avísame cuando llegue ── */}
        <Reveal>
          <section className={styles.notifySection}>
            <Sparkle
              className={`${styles.deco} ${styles.notifySparkle}`}
              color="var(--olffy-amarillo)"
              size={20}
            />
            <div className={styles.notifyInner}>
              <span className={styles.notifyIcon}>
                <GiftIcon name="mail" size={22} color="var(--olffy-morado)" />
              </span>
              <h2 className={styles.notifyTitle}>
                ¿Quieres enterarte primero?
              </h2>
              <p className={styles.notifyText}>
                Déjanos tu correo y te avisamos cuando lancemos nuevas
                colecciones.
              </p>

              {emailSent ? (
                <p className={styles.notifySuccess}>
                  Listo, te avisaremos cuando haya novedades.
                </p>
              ) : (
                <form
                  className={styles.notifyForm}
                  onSubmit={handleNotify}
                  noValidate
                >
                  <input
                    type="email"
                    className={`${styles.notifyInput} ${emailError ? styles.notifyInputError : ""}`}
                    placeholder="tu@correo.cl"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    aria-label="Tu correo electrónico"
                    aria-invalid={emailError}
                  />
                  <button type="submit" className={styles.notifyBtn}>
                    Avísame
                  </button>
                </form>
              )}
              {emailError && !emailSent && (
                <p className={styles.notifyError}>
                  Escribe un correo válido para avisarte.
                </p>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
