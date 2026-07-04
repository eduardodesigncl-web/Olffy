// @ts-nocheck
import { useState } from "react";
import { Check } from "lucide-react";

const C = { orange: "#e94300", purple: "#5957b0", yellow: "#fab405" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

function Facebook({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.4l.6-3h-3V9c0-.6.4-1 1-1Z" />
    </svg>
  );
}

function Instagram({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Twitter({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.9 5h2.4l-5.2 6 6.1 8h-4.8l-3.7-4.9L9.4 19H7l5.6-6.4L6.8 5h4.9l3.4 4.5L18.9 5Zm-.8 12.6h1.3L11 6.4H9.6l8.5 11.2Z" />
    </svg>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setEmail("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="flex flex-col gap-4 w-[400px] shrink-0">
      <div className="flex flex-col gap-1">
        <p className="text-[20px] text-white" style={{ fontFamily: T.piepie }}>
          Suscríbete
        </p>
        <p
          className="text-[16px]"
          style={{
            fontFamily: T.ivy,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Novedades, lanzamientos y ofertas exclusivas.
        </p>
      </div>
      {sent ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          <Check size={16} />
          ¡Gracias por suscribirte! 🎉
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="flex-1 rounded-full px-4 py-2 text-[14px] outline-none transition-colors"
            style={{
              fontFamily: T.poppins,
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.25)",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-full text-white text-[14px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ fontFamily: T.poppins, background: C.orange }}
          >
            Suscribirse
          </button>
        </form>
      )}
    </div>
  );
}

interface FooterProps {
  onAdminOpen?: () => void;
}

export function Footer({ onAdminOpen }: FooterProps) {
  return (
    <footer className="px-6 md:px-16 py-14" style={{ background: C.purple }}>
      {/* Mobile: stacked vertically */}
      <div className="flex flex-col gap-10 md:hidden">
        {/* Logo + tagline + social */}
        <div className="flex flex-col gap-4">
          <span style={{ fontFamily: T.piepie, fontSize: 22, color: C.yellow }}>
            OLFFY
          </span>
          <p
            className="text-[14px] leading-snug"
            style={{
              fontFamily: T.ivy,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Papelería ilustrada para crear y regalar con magia.
          </p>
          <div className="flex gap-4">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <button
                key={i}
                style={{ color: "rgba(255,255,255,0.5)" }}
                className="hover:text-white transition-colors"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
        {/* Tienda + Nosotros side by side */}
        <div className="flex gap-10">
          <div className="flex flex-col gap-3 flex-1">
            <p
              className="text-[16px] text-white"
              style={{ fontFamily: T.piepie }}
            >
              Tienda
            </p>
            <div className="flex flex-col gap-2">
              {[
                "Cuadernos",
                "Planners",
                "Stickers",
                "Calendarios",
                "Regalos",
              ].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[13px] hover:text-white transition-colors"
                  style={{
                    fontFamily: T.poppins,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <p
              className="text-[16px] text-white"
              style={{ fontFamily: T.piepie }}
            >
              Nosotros
            </p>
            <div className="flex flex-col gap-2">
              {["Nuestra historia", "Sustentabilidad", "Blog", "Contacto"].map(
                (l) => (
                  <a
                    key={l}
                    href="#"
                    className="text-[13px] hover:text-white transition-colors"
                    style={{
                      fontFamily: T.poppins,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {l}
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
        {/* Newsletter — button below input */}
        <div className="flex flex-col gap-3">
          <p
            className="text-[15px] text-white"
            style={{ fontFamily: T.piepie }}
          >
            Suscríbete
          </p>
          <p
            className="text-[13px]"
            style={{ fontFamily: T.poppins, color: "rgba(255,255,255,0.55)" }}
          >
            Novedades y las últimas ofertas
          </p>
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full px-4 py-2.5 rounded-xl text-[13px] bg-white/10 text-white placeholder-white/30 outline-none border border-white/15 focus:bg-white/15 transition-colors"
            style={{ fontFamily: T.poppins }}
          />
          <button
            className="w-full py-2.5 rounded-xl text-[14px] text-white transition-opacity hover:opacity-90"
            style={{ background: C.orange, fontFamily: T.poppins }}
          >
            Suscribirse
          </button>
        </div>
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex gap-16 items-start">
        <div className="flex flex-col gap-5 shrink-0 w-52">
          <span style={{ fontFamily: T.piepie, fontSize: 22, color: C.yellow }}>
            OLFFY
          </span>
          <p
            className="text-[14px] leading-snug"
            style={{
              fontFamily: T.ivy,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Papelería ilustrada para crear y regalar con magia.
          </p>
          <div className="flex gap-4">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <button
                key={i}
                style={{ color: "rgba(255,255,255,0.5)" }}
                className="hover:text-white transition-colors"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-16 flex-1">
          {[
            {
              title: "Tienda",
              links: [
                "Cuadernos",
                "Planners",
                "Stickers",
                "Calendarios",
                "Regalos",
              ],
            },
            {
              title: "Nosotros",
              links: [
                "Nuestra historia",
                "Sustentabilidad",
                "Blog",
                "Contacto",
              ],
            },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <p
                className="text-[17px] text-white"
                style={{ fontFamily: T.piepie }}
              >
                {col.title}
              </p>
              <div className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    className="text-[14px] hover:text-white transition-colors"
                    style={{
                      fontFamily: T.poppins,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Newsletter />
      </div>

      {/* Copyright row */}
      <div
        className="mt-12 pt-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
      >
        <p
          className="text-[13px]"
          style={{ fontFamily: T.poppins, color: "rgba(255,255,255,0.35)" }}
        >
          © 2026 <span style={{ color: C.yellow }}>Olffy</span>. Creado
          inteligentemente por{" "}
          <span onDoubleClick={onAdminOpen} style={{ cursor: "default" }}>
            Mouse Labs 🐭
          </span>
        </p>
      </div>
    </footer>
  );
}
