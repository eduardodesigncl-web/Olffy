// @ts-nocheck
// NewLaunchesSection — "Nuevos Lanzamientos" section on the home page
// Extracted from App.tsx home section
import Image from "next/image";

const C = { orange: "#e94300" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

interface NewLaunchesSectionProps {
  onExplore?: () => void;
  imageSrc?: string;
}

export function NewLaunchesSection({
  onExplore,
  imageSrc,
}: NewLaunchesSectionProps) {
  return (
    <section className="bg-white">
      {/* Mobile layout */}
      <div className="flex flex-col gap-5 md:hidden px-6 pt-16 pb-14">
        <div className="flex flex-col gap-2">
          <span
            className="text-[11px] tracking-[0.2em] uppercase text-black/40"
            style={{ fontFamily: T.poppins }}
          >
            Colección actual
          </span>
          <h2
            className="leading-tight text-black/80"
            style={{
              fontFamily: T.ivy,
              fontStyle: "italic",
              fontSize: "clamp(28px, 7vw, 40px)",
            }}
          >
            Nuevos
          </h2>
          <h2
            className="leading-none text-black/85 -mt-1"
            style={{ fontFamily: T.piepie, fontSize: "clamp(36px, 9vw, 52px)" }}
          >
            Lanzamientos
          </h2>
        </div>
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ marginLeft: 8, marginRight: 8, height: 280 }}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#f2e0cc]" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <p
            className="text-[15px] text-black/50 leading-relaxed"
            style={{ fontFamily: T.poppins }}
          >
            Explora nuestros productos más recientes, diseñados para inspirarte
            cada día.
          </p>
          <button
            className="self-start px-7 py-3.5 rounded-full text-white text-[15px] transition-transform hover:scale-105 active:scale-95"
            style={{ fontFamily: T.poppins, background: C.orange }}
            onClick={onExplore}
          >
            Explorar tienda →
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-24 px-16 py-20">
        <div className="flex flex-col gap-8 flex-1 max-w-[480px]">
          <div className="flex flex-col gap-3">
            <span
              className="text-[12px] tracking-[0.2em] uppercase text-black/40"
              style={{ fontFamily: T.poppins }}
            >
              Colección actual
            </span>
            <h2
              className="leading-tight text-black/80"
              style={{
                fontFamily: T.ivy,
                fontStyle: "italic",
                fontSize: "clamp(32px, 3.5vw, 52px)",
              }}
            >
              Nuevos
            </h2>
            <h2
              className="leading-none text-black/85 -mt-2"
              style={{
                fontFamily: T.piepie,
                fontSize: "clamp(40px, 4.5vw, 64px)",
              }}
            >
              Lanzamientos
            </h2>
            <p
              className="text-[16px] text-black/50 leading-relaxed mt-2"
              style={{ fontFamily: T.poppins }}
            >
              Explora nuestros productos más recientes, diseñados para
              inspirarte cada día.
            </p>
          </div>
          <button
            className="self-start px-7 py-3.5 rounded-full text-white text-[15px] font-medium transition-transform hover:scale-105 active:scale-95"
            style={{ fontFamily: T.poppins, background: C.orange }}
            onClick={onExplore}
          >
            Explorar tienda →
          </button>
        </div>
        <div className="relative flex-1 h-[500px] rounded-2xl overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#f2e0cc]" />
          )}
        </div>
      </div>
    </section>
  );
}
