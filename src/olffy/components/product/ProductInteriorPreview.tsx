import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { GiftIcon } from "../storefront";
import { InteriorPageArt } from "./ProductInteriorArt";
import type {
  CustomInterior,
  InteriorTab,
  InteriorType,
} from "../../data/productDetails";
import type { Product } from "../../types";
import styles from "./ProductInteriorPreview.module.css";

interface ProductInteriorPreviewProps {
  product: Product;
  tabs: InteriorTab[];
  // Interior dibujado página por página (solo productos con diseño propio).
  custom?: CustomInterior | null;
}

const DAYS = ["LUN", "MAR", "MIÉ", "JUE"];
const DAYS_B = ["VIE", "SÁB", "DOM", "NOTAS"];
const SWIPE_THRESHOLD = 40;

// Arte de página según el tipo de interior (mock dibujado con CSS/SVG).
// Cuando la tab tenga `src` real (spread exportado a imagen), se muestra tal cual.
function PageArt({
  type,
  side,
}: {
  type: InteriorType;
  side: "left" | "right";
}) {
  switch (type) {
    case "semanal": {
      const days = side === "left" ? DAYS : DAYS_B;
      return (
        <div className={styles.weekGrid}>
          {days.map((d) => (
            <div key={d} className={styles.weekBox}>
              <span className={styles.weekDay}>{d}</span>
              <span className={styles.weekLines} aria-hidden="true" />
            </div>
          ))}
        </div>
      );
    }
    case "mensual":
      return (
        <div className={styles.monthWrap}>
          <span className={styles.monthTitle}>
            {side === "left" ? "ENERO" : "FEBRERO"}
          </span>
          <div className={styles.monthGrid} aria-hidden="true">
            {Array.from({ length: 35 }, (_, i) => (
              <span key={i} className={styles.monthCell} />
            ))}
          </div>
        </div>
      );
    case "punteado":
      return <div className={styles.dotted} aria-hidden="true" />;
    case "rayado":
      return <div className={styles.ruled} aria-hidden="true" />;
    case "notas":
      return (
        <div className={styles.notesWrap}>
          <span className={styles.notesTitle}>
            {side === "left" ? "Notas" : "Ideas"}
          </span>
          <div className={styles.ruled} aria-hidden="true" />
        </div>
      );
    case "papel":
      return (
        <div className={styles.paperWrap}>
          <span className={styles.paperGrain} aria-hidden="true" />
          <span className={styles.paperNote}>
            {side === "left" ? "Papel 120 g/m²" : "Marfil, suave al tacto"}
          </span>
        </div>
      );
    case "ilustracion":
      return (
        <div className={styles.illoWrap} aria-hidden="true">
          <span
            className={`${styles.illoBlob} ${side === "right" ? styles.illoBlobAlt : ""}`}
          />
          <GiftIcon
            name={side === "left" ? "palette" : "sparkles"}
            size={44}
            color="rgba(42,28,16,0.35)"
          />
        </div>
      );
    case "stickers":
      return (
        <div className={styles.stickerSheet} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className={styles.stickerDot}
              style={{ background: ["#FBD4C2", "#DEDDF2", "#FFE9A8"][i % 3] }}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}

// Visor de interior tipo libro abierto: se hojea con flechas, tabs, teclado o
// arrastre. Solo se renderiza si el producto tiene interior que mostrar
// (tabs.length > 0). Con `custom`, la doble página toma el formato real del
// cuaderno (anillado, tapa y páginas dibujadas una a una).
export function ProductInteriorPreview({
  product,
  tabs,
  custom,
}: ProductInteriorPreviewProps) {
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<"next" | "prev">("next");
  const dragStart = useRef<number | null>(null);
  const rulingId = tabs.find((tab) =>
    ["cuadriculado", "punteado", "rayado"].includes(tab.id),
  )?.id;

  const shown = useRef({ productId: product.id, ruling: rulingId });

  useEffect(() => {
    // Al cambiar de producto (relacionados) se vuelve a la primera página.
    if (shown.current.productId !== product.id) {
      shown.current = { productId: product.id, ruling: rulingId };
      setIndex(0);
      return;
    }
    // Si se elige otro patrón de hojas en la ficha, el visor salta a esa
    // página para que se vea lo que se está comprando.
    if (shown.current.ruling === rulingId) return;
    shown.current = { ...shown.current, ruling: rulingId };
    const target = tabs.findIndex((tab) => tab.id === rulingId);
    if (target >= 0) {
      setTurn("next");
      setIndex(target);
    }
  }, [product.id, rulingId, tabs]);

  if (tabs.length === 0) return null;

  const active = tabs[Math.min(index, tabs.length - 1)]!;
  const go = (target: number, direction: "next" | "prev") => {
    setTurn(direction);
    setIndex((target + tabs.length) % tabs.length);
  };
  const prev = () => go(index - 1, "prev");
  const next = () => go(index + 1, "next");

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  };

  // Arrastre / swipe sobre la doble página.
  const handlePointerDown = (event: PointerEvent) => {
    dragStart.current = event.clientX;
  };
  const handlePointerUp = (event: PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (start === null) return;
    const delta = event.clientX - start;
    if (delta <= -SWIPE_THRESHOLD) next();
    else if (delta >= SWIPE_THRESHOLD) prev();
  };

  const bookStyle = custom
    ? ({
        "--page-ratio": custom.pageRatio,
        "--ink": custom.art.ink,
        "--paper": custom.art.paper,
        "--soft": custom.art.soft,
        "--accent": custom.art.accent,
        "--binding": custom.art.binding,
        "--edge": custom.art.edge,
      } as CSSProperties)
    : undefined;

  return (
    <section
      className={styles.section}
      aria-label={`Interior de ${product.name}`}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>Mira su interior</h2>
        <span className={styles.counter}>
          {index + 1} / {tabs.length}
        </span>
      </div>

      {custom && (
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Páginas del interior"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`${styles.tab} ${i === index ? styles.tabActive : ""}`}
              onClick={() => go(i, i > index ? "next" : "prev")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={`${styles.viewer} ${custom ? styles.viewerCustom : ""}`}>
        <button
          type="button"
          className={styles.arrow}
          onClick={prev}
          aria-label="Página anterior"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {active.src ? (
          <img
            className={styles.spreadImg}
            src={active.src}
            alt={`${product.name} — ${active.label}`}
          />
        ) : custom ? (
          <div
            className={styles.notebook}
            style={bookStyle}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => (dragStart.current = null)}
          >
            <div
              className={`${styles.book} ${styles.bookCustom} ${turn === "next" ? styles.turnNext : styles.turnPrev}`}
              key={`${active.id}-${index}`}
            >
              <div className={`${styles.page} ${styles.pageLeft}`}>
                <InteriorPageArt
                  type={active.id}
                  side="left"
                  art={custom.art}
                />
              </div>
              <span className={styles.rings} aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <span key={i} className={styles.ring} />
                ))}
              </span>
              <div className={`${styles.page} ${styles.pageRight}`}>
                <InteriorPageArt
                  type={active.id}
                  side="right"
                  art={custom.art}
                />
              </div>
            </div>
            <span className={styles.elastic} aria-hidden="true">
              <span className={styles.charm} />
            </span>
          </div>
        ) : (
          <div className={styles.book} key={active.id}>
            <div className={`${styles.page} ${styles.pageLeft}`}>
              <PageArt type={active.id} side="left" />
            </div>
            <span className={styles.spine} aria-hidden="true" />
            <div className={`${styles.page} ${styles.pageRight}`}>
              <PageArt type={active.id} side="right" />
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.arrow}
          onClick={next}
          aria-label="Página siguiente"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.dots}>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              aria-label={`Ver ${tab.label}`}
              aria-current={i === index}
              onClick={() => go(i, i > index ? "next" : "prev")}
            />
          ))}
        </div>
        <p className={styles.caption} aria-live="polite">
          Página {index + 1} de {tabs.length} · {active.label} —{" "}
          {active.hint ?? product.name}
        </p>
      </div>
    </section>
  );
}
