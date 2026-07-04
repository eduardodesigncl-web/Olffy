// @ts-nocheck
import Image from "next/image";

const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

interface KnowOlffySectionProps {
  onHistoryClick?: () => void;
  imageSrc?: string;
}

export function KnowOlffySection({
  onHistoryClick,
  imageSrc,
}: KnowOlffySectionProps) {
  return (
    <section className="bg-white">
      {/* Mobile layout */}
      <div className="flex flex-col gap-8 md:hidden px-6 pt-14 pb-12">
        <div className="flex flex-col gap-3">
          <span
            className="text-[11px] tracking-[0.2em] uppercase text-black/40"
            style={{ fontFamily: T.poppins }}
          >
            Nuestra historia
          </span>
          <h2
            className="leading-tight text-black/80"
            style={{
              fontFamily: T.ivy,
              fontStyle: "italic",
              fontSize: "clamp(30px, 7vw, 42px)",
            }}
          >
            Conoce
          </h2>
          <h2
            className="leading-none text-black/85 -mt-2"
            style={{
              fontFamily: T.piepie,
              fontSize: "clamp(44px, 10vw, 62px)",
            }}
          >
            OLFFY
          </h2>
        </div>
        <div className="flex flex-col gap-5">
          <p
            className="text-[17px] text-black/60 leading-relaxed"
            style={{ fontFamily: T.ivy, fontStyle: "italic" }}
          >
            Descubre la historia detrás de OLFFY y cómo creamos productos únicos
            para organizar tu mundo con magia.
          </p>
          <button
            className="self-start px-6 py-3 border-2 border-black/80 rounded-full text-[14px] text-black/80 hover:bg-black/5 transition-colors"
            style={{ fontFamily: T.poppins }}
            onClick={onHistoryClick}
          >
            Ver nuestra historia →
          </button>
        </div>
        <div className="relative w-full h-[200px] rounded-2xl overflow-hidden bg-[#eee]">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex flex-col gap-20 px-16 py-20">
        <div className="flex gap-24 items-start">
          <div className="flex-1 flex flex-col gap-4">
            <span
              className="text-[12px] tracking-[0.2em] uppercase text-black/40"
              style={{ fontFamily: T.poppins }}
            >
              Nuestra historia
            </span>
            <h2
              className="leading-tight text-black/80"
              style={{
                fontFamily: T.ivy,
                fontStyle: "italic",
                fontSize: "clamp(32px, 3vw, 48px)",
              }}
            >
              Conoce
            </h2>
            <h2
              className="leading-none text-black/85 -mt-3"
              style={{
                fontFamily: T.piepie,
                fontSize: "clamp(48px, 5vw, 72px)",
              }}
            >
              OLFFY
            </h2>
          </div>
          <div className="flex-1 pt-6 flex flex-col gap-6">
            <p
              className="text-[20px] text-black/70 leading-relaxed"
              style={{ fontFamily: T.ivy, fontStyle: "italic" }}
            >
              Descubre la historia detrás de OLFFY y cómo creamos productos
              únicos para organizar tu mundo con magia.
            </p>
            <button
              className="self-start px-6 py-3 border-2 border-black/80 rounded-full text-[15px] text-black/80 hover:bg-black/5 transition-colors"
              style={{ fontFamily: T.poppins }}
              onClick={onHistoryClick}
            >
              Ver nuestra historia →
            </button>
          </div>
        </div>
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-[#eee]">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}
