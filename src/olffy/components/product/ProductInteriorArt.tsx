import { useId, type CSSProperties } from "react";
import { GiftIcon, type GiftIconName } from "../storefront";
import type {
  InteriorArt,
  InteriorMotif,
  InteriorType,
} from "../../data/productDetails";
import styles from "./ProductInteriorArt.module.css";

// Arte de las páginas interiores de los productos con interior propio
// (`customInteriorFor`). Cada página se dibuja con SVG/CSS a partir del
// motivo y los colores del diseño. Cuando una tab traiga `src` real, el
// visor muestra la foto y este arte no se renderiza.

type Side = "left" | "right";

const WEEK_LEFT = ["LUNES", "MARTES", "MIÉRCOLES"];
const WEEK_RIGHT = ["JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
const MONTHS_LEFT = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO"];
const MONTHS_RIGHT = [
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
const DATA_FIELDS: { icon: GiftIconName; label: string }[] = [
  { icon: "users", label: "Nombre" },
  { icon: "pin", label: "Dirección" },
  { icon: "mail", label: "Correo" },
  { icon: "store", label: "Trabajo o estudio" },
  { icon: "camera", label: "Redes" },
];

// ── Glifos del motivo (siluetas del patrón de la guarda) ─────────────────

function DogGlyph({ x, y, flip = false, scale = 1 }: GlyphProps) {
  return (
    <g transform={placement(x, y, scale, flip)}>
      <rect x="4" y="8" width="18" height="9" rx="4.5" />
      <rect x="5.5" y="14" width="3" height="9" rx="1.5" />
      <rect x="10" y="14" width="3" height="9" rx="1.5" />
      <rect x="17" y="14" width="3" height="9" rx="1.5" />
      <rect x="19" y="6" width="6" height="8" rx="3" />
      <circle cx="24" cy="6" r="4" />
      <rect x="26" y="4.6" width="6" height="3.6" rx="1.8" />
      <path d="M21 3.4 24.8 0.8 25.8 5.6Z" />
      <path
        d="M4.6 10C0.6 8 0.2 4 2.8 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

function BoneGlyph({ x, y, flip = false, scale = 1 }: GlyphProps) {
  return (
    <g transform={placement(x, y, scale, flip)}>
      <rect x="4" y="4.4" width="14" height="4.2" rx="2.1" />
      <circle cx="4.2" cy="3.4" r="3.1" />
      <circle cx="4.2" cy="9.6" r="3.1" />
      <circle cx="17.8" cy="3.4" r="3.1" />
      <circle cx="17.8" cy="9.6" r="3.1" />
    </g>
  );
}

function PawGlyph({ x, y, flip = false, scale = 1 }: GlyphProps) {
  return (
    <g transform={placement(x, y, scale, flip)}>
      <ellipse cx="8" cy="10.4" rx="5.4" ry="4.6" />
      <ellipse cx="2.6" cy="4.6" rx="2.2" ry="2.9" />
      <ellipse cx="7.4" cy="2.4" rx="2.2" ry="3" />
      <ellipse cx="12.2" cy="3.2" rx="2.2" ry="2.9" />
      <ellipse cx="15.4" cy="7.6" rx="2" ry="2.6" />
    </g>
  );
}

function LeafGlyph({ x, y, flip = false, scale = 1 }: GlyphProps) {
  return (
    <g transform={placement(x, y, scale, flip)}>
      <path d="M2 20C2 9 9 2 20 2 20 13 13 20 2 20Z" />
      <path
        d="M4 18 18 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

function StarGlyph({ x, y, flip = false, scale = 1 }: GlyphProps) {
  return (
    <g transform={placement(x, y, scale, flip)}>
      <path d="M9 0C10.2 6.4 11.6 7.8 18 9 11.6 10.2 10.2 11.6 9 18 7.8 11.6 6.4 10.2 0 9 6.4 7.8 7.8 6.4 9 0Z" />
    </g>
  );
}

interface GlyphProps {
  x: number;
  y: number;
  flip?: boolean;
  scale?: number;
}

function placement(x: number, y: number, scale: number, flip: boolean): string {
  return `translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`;
}

// Una teselación de 100×100 por motivo: siluetas alternadas y sueltas, como
// el papel de guarda impreso.
function MotifTile({ motif }: { motif: InteriorMotif }) {
  if (motif === "perro") {
    return (
      <>
        <DogGlyph x={2} y={4} scale={0.9} />
        <BoneGlyph x={44} y={10} scale={0.8} />
        <DogGlyph x={96} y={4} scale={0.86} flip />
        <DogGlyph x={22} y={32} scale={0.82} flip />
        <PawGlyph x={62} y={34} scale={0.72} />
        <BoneGlyph x={98} y={36} scale={0.75} flip />
        <DogGlyph x={0} y={58} scale={0.84} />
        <DogGlyph x={72} y={58} scale={0.88} flip />
        <PawGlyph x={8} y={84} scale={0.7} />
        <DogGlyph x={62} y={80} scale={0.8} flip />
        <BoneGlyph x={70} y={84} scale={0.72} />
      </>
    );
  }
  if (motif === "hoja") {
    return (
      <>
        <LeafGlyph x={4} y={6} scale={0.95} />
        <LeafGlyph x={56} y={2} scale={0.8} flip />
        <StarGlyph x={78} y={26} scale={0.5} />
        <LeafGlyph x={30} y={38} scale={0.85} />
        <LeafGlyph x={92} y={52} scale={0.9} flip />
        <LeafGlyph x={6} y={64} scale={0.8} flip />
        <StarGlyph x={44} y={76} scale={0.55} />
        <LeafGlyph x={62} y={72} scale={0.9} />
      </>
    );
  }
  return (
    <>
      <StarGlyph x={6} y={6} scale={0.9} />
      <StarGlyph x={52} y={16} scale={0.6} />
      <StarGlyph x={80} y={2} scale={0.8} />
      <StarGlyph x={26} y={40} scale={0.7} />
      <StarGlyph x={68} y={48} scale={0.95} />
      <StarGlyph x={4} y={72} scale={0.65} />
      <StarGlyph x={44} y={78} scale={0.85} />
      <StarGlyph x={88} y={80} scale={0.6} />
    </>
  );
}

// Patrón repetido a página completa (guarda) o como marca de agua tenue.
function MotifPattern({
  art,
  variant = "guarda",
}: {
  art: InteriorArt;
  variant?: "guarda" | "agua";
}) {
  const patternId = useId();
  const watermark = variant === "agua";
  const tile = watermark ? 128 : 96;

  return (
    <svg
      className={styles.patternSvg}
      viewBox="0 0 300 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={tile}
          height={tile}
          patternTransform={`scale(${tile / 100})`}
        >
          <g fill={art.ink} color={art.ink}>
            <MotifTile motif={art.motif} />
          </g>
        </pattern>
      </defs>
      <rect width="300" height="300" fill={watermark ? art.soft : art.paper} />
      <rect
        width="300"
        height="300"
        fill={`url(#${patternId})`}
        opacity={watermark ? 0.11 : 1}
      />
    </svg>
  );
}

// Sello circular impreso al pie de las páginas (como el de las guardas).
function InteriorStamp({ art }: { art: InteriorArt }) {
  return (
    <span className={styles.stamp} style={{ background: art.ink }}>
      <svg viewBox="0 0 18 18" aria-hidden="true">
        <g fill={art.paper}>
          {art.motif === "perro" ? (
            <PawGlyph x={1} y={1} scale={0.92} />
          ) : art.motif === "hoja" ? (
            <LeafGlyph x={-1} y={-1} scale={0.85} />
          ) : (
            <StarGlyph x={0} y={0} scale={1} />
          )}
        </g>
      </svg>
    </span>
  );
}

// ── Páginas ──────────────────────────────────────────────────────────────

interface InteriorPageArtProps {
  type: InteriorType;
  side: Side;
  art: InteriorArt;
}

export function InteriorPageArt({ type, side, art }: InteriorPageArtProps) {
  switch (type) {
    // Guarda: tapa interior estampada + primera hoja con huellas.
    case "guarda":
      if (side === "left") {
        return (
          <div className={styles.bleed}>
            <MotifPattern art={art} />
            <InteriorStamp art={art} />
          </div>
        );
      }
      return (
        <div className={styles.bleed}>
          <MotifPattern art={art} variant="agua" />
          <svg
            className={styles.trail}
            viewBox="0 0 100 130"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <g fill={art.ink} opacity="0.85">
              <PawGlyph x={62} y={14} scale={0.7} />
              <PawGlyph x={46} y={30} scale={0.7} />
              <PawGlyph x={52} y={48} scale={0.7} />
              <PawGlyph x={34} y={62} scale={0.7} />
              <PawGlyph x={40} y={82} scale={0.7} />
              <PawGlyph x={22} y={96} scale={0.7} />
            </g>
          </svg>
        </div>
      );

    // Plan mensual: el mes repartido en la doble página, sin fechas impresas.
    case "mensual": {
      const days = side === "left" ? WEEK_LEFT : WEEK_RIGHT;
      return (
        <div className={styles.monthPage}>
          {/* La cabecera va en ambas páginas —vacía a la derecha— para que
              las cuadrículas del mes calcen a la misma altura. */}
          <div className={styles.monthHead}>
            {side === "left" && (
              <>
                <span className={styles.monthField}>MES</span>
                <span className={styles.monthFieldSmall}>AÑO</span>
              </>
            )}
          </div>
          <div
            className={styles.monthGrid}
            style={{ "--cols": days.length } as CSSProperties}
          >
            {days.map((day) => (
              <span key={day} className={styles.monthDay}>
                {day}
              </span>
            ))}
            {Array.from({ length: days.length * 5 }, (_, i) => (
              <span key={i} className={styles.monthCell}>
                <span className={styles.monthTick} aria-hidden="true" />
              </span>
            ))}
          </div>
          <div className={styles.monthNotes} aria-hidden="true">
            <span className={styles.gridFill} />
            {side === "right" && <InteriorStamp art={art} />}
          </div>
        </div>
      );
    }

    // Vista anual: los doce meses repartidos entre ambas páginas.
    case "anual": {
      const months = side === "left" ? MONTHS_LEFT : MONTHS_RIGHT;
      return (
        <div className={styles.yearPage}>
          {months.map((month) => (
            <div key={month} className={styles.yearMonth}>
              <span className={styles.yearMonthName} style={{ color: art.ink }}>
                {month}
              </span>
              <span className={styles.yearMonthGrid} aria-hidden="true">
                {Array.from({ length: 35 }, (_, i) => (
                  <span key={i} className={styles.yearMonthCell} />
                ))}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Hojas interiores: el patrón que la persona eligió en la ficha.
    case "cuadriculado":
    case "punteado":
    case "rayado": {
      const fill =
        type === "cuadriculado"
          ? styles.gridFill
          : type === "punteado"
            ? styles.dotted
            : styles.ruled;
      return (
        <div className={styles.rulingPage}>
          <span className={styles.rulingHead} aria-hidden="true" />
          <span className={fill} aria-hidden="true" />
          {side === "right" && <InteriorStamp art={art} />}
        </div>
      );
    }

    // Datos personales: última hoja, enfrentada a la guarda del final.
    case "datos":
      if (side === "left") {
        return (
          <div className={styles.bleed}>
            <MotifPattern art={art} />
            <InteriorStamp art={art} />
          </div>
        );
      }
      return (
        <div className={styles.bleed}>
          <MotifPattern art={art} variant="agua" />
          <div className={styles.dataPage}>
            <p className={styles.dataQuote}>
              Con papel y propósito, cada día es un paso hacia el éxito.
            </p>
            <span className={styles.dataTitle} style={{ color: art.ink }}>
              Información
            </span>
            <ul className={styles.dataList}>
              {DATA_FIELDS.map((field) => (
                <li key={field.label} className={styles.dataRow}>
                  <span
                    className={styles.dataIcon}
                    style={{ background: art.ink }}
                  >
                    <GiftIcon name={field.icon} size={11} color="#ffffff" />
                  </span>
                  <span className={styles.dataField}>{field.label}</span>
                </li>
              ))}
            </ul>
            <span className={styles.dataLogo}>OLFFY®</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
