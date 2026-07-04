// @ts-nocheck
import { X } from "lucide-react";

const C = { purple: "#5957b0" };
const T = { poppins: "'Poppins', sans-serif" };

const PROMO_TEXT =
  "Envíos a todo Chile 🧡  ·  Retiro gratis en tienda en Viña del Mar ✨  ·  Cuadernos, planners, stickers y papelería ilustrada ✨  ·  Nuevas colecciones disponibles 🌸  ·  ";

interface PromoBannerProps {
  onClose: () => void;
}

export function PromoBanner({ onClose }: PromoBannerProps) {
  return (
    <div
      className="flex items-center py-2 w-full z-10 overflow-hidden"
      style={{ background: C.purple }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { display: flex; animation: marquee 28s linear infinite; white-space: nowrap; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="flex-1 overflow-hidden">
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{ fontFamily: T.poppins }}
              className="text-[13px] text-white/80 leading-5 pr-0"
            >
              {PROMO_TEXT}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-3 mr-3 text-white/70 hover:text-white transition-colors shrink-0"
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
