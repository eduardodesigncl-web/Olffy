// @ts-nocheck
import { useState, useRef } from "react";
import { Search, User, ShoppingBag, X, ChevronDown } from "lucide-react";

const C = {
  cream: "#fff5d9",
  yellow: "#fab405",
  orange: "#e94300",
  purple: "#5957b0",
};
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

const NAV_ITEMS: { label: string; items?: string[] }[] = [
  { label: "Inicio" },
  {
    label: "Tienda",
    items: [
      "Agendas y planners",
      "Cuadernos y libretas",
      "Stickers",
      "Tarjetas y notas",
      "Marcapáginas",
      "Accesorios y empaques",
    ],
  },
  {
    label: "Novedades",
    items: [
      "Nuevos lanzamientos",
      "Colecciones recientes",
      "Más vendidos",
      "Próximamente",
    ],
  },
  {
    label: "Regalos",
    items: [
      "Regalos para amigas",
      "Regalos para estudiantes",
      "Kits de papelería",
      "Por precio: hasta $5.000",
      "Por precio: hasta $10.000",
      "Por precio: hasta $15.000",
      "Empaque para regalo",
    ],
  },
  {
    label: "Nuestra historia",
    items: [
      "Sobre OLFFY",
      "Nuestra tienda en Viña del Mar",
      "Proceso creativo",
      "Comunidad OLFFY",
    ],
  },
  {
    label: "Contacto",
    items: [
      "Redes sociales",
      "Dirección / Mapa",
      "Horarios",
      "Preguntas frecuentes",
    ],
  },
];

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAccountClick: () => void;
  activeNav: string;
  setActiveNav: (v: string) => void;
  onSubNavClick: (item: string) => void;
}

export function Navbar({
  cartCount,
  onCartClick,
  onAccountClick,
  activeNav,
  setActiveNav,
  onSubNavClick,
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedNav, setMobileExpandedNav] = useState<string | null>(
    null,
  );

  function openMenu(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredNav(label);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setHoveredNav(null), 120);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const searchOverlay = searchOpen && (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 px-6"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSearchOpen(false);
          setSearchValue("");
        }
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3">
        <Search size={18} className="text-black/40 shrink-0" />
        <input
          autoFocus
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Escape" && (setSearchOpen(false), setSearchValue(""))
          }
          placeholder="Buscar productos..."
          className="flex-1 text-[15px] outline-none bg-transparent"
          style={{ fontFamily: T.poppins }}
        />
        <button
          onClick={() => {
            setSearchOpen(false);
            setSearchValue("");
          }}
        >
          <X
            size={18}
            className="text-black/40 hover:text-black/80 transition-colors"
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full relative z-20 bg-white border-b border-black/10">
      {searchOverlay}

      {/* Desktop navbar */}
      <div className="hidden md:flex px-12 py-4 items-center justify-between relative">
        <a
          href="/"
          className="shrink-0"
          style={{
            display: "flex",
            alignItems: "center",
            width: 160,
            height: 50,
          }}
        >
          {/* Logo placeholder — replace with <OlffyLogoNav /> */}
          <span style={{ fontFamily: T.piepie, fontSize: 22, color: C.orange }}>
            OLFFY
          </span>
        </a>

        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-8">
          {NAV_ITEMS.map(({ label, items }) => (
            <div
              key={label}
              className="relative"
              onMouseEnter={() => openMenu(label)}
              onMouseLeave={scheduleClose}
            >
              <button
                onClick={() => setActiveNav(label)}
                className={`flex items-center gap-1 text-[15px] leading-5 transition-colors whitespace-nowrap py-1 ${activeNav === label ? "text-black/90 border-b-2 border-black/80" : "text-black/70 hover:text-black/90"}`}
                style={{ fontFamily: T.poppins }}
              >
                {label}
                {items && (
                  <ChevronDown
                    size={14}
                    className={`opacity-50 transition-transform duration-200 ${hoveredNav === label ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {items && hoveredNav === label && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-black/10 rounded-xl shadow-lg py-2 min-w-[220px] z-50"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-black/10 rotate-45" />
                  <ul>
                    {items.map((item) => (
                      <li key={item}>
                        <button
                          className="w-full text-left px-4 py-2.5 text-[14px] text-black/70 hover:text-black hover:bg-black/[0.04] transition-colors"
                          style={{ fontFamily: T.poppins }}
                          onClick={() => {
                            setActiveNav(label);
                            setHoveredNav(null);
                            onSubNavClick(item);
                          }}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="text-black/80 hover:text-black transition-colors shrink-0"
            aria-label="Buscar"
          >
            <Search size={22} />
          </button>
          <button
            onClick={onAccountClick}
            className="text-black/80 hover:text-black transition-colors"
            aria-label="Mi cuenta"
          >
            <User size={22} />
          </button>
          <button
            onClick={onCartClick}
            className="relative text-black/80 hover:text-black transition-colors"
            aria-label="Carrito"
            data-action="open-cart"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: C.orange }}
                data-bind="cart-count"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navbar */}
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <a href="/" style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: T.piepie, fontSize: 20, color: C.orange }}>
            OLFFY
          </span>
        </a>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="text-black/80"
            aria-label="Buscar"
          >
            <Search size={22} />
          </button>
          <button
            onClick={onAccountClick}
            className="text-black/80"
            aria-label="Mi cuenta"
          >
            <User size={22} />
          </button>
          <button
            onClick={onCartClick}
            className="relative text-black/80"
            aria-label="Carrito"
            data-action="open-cart"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: C.orange }}
                data-bind="cart-count"
              >
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="text-black/80"
            aria-label="Menú"
          >
            {mobileMenuOpen ? (
              <X size={22} />
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M2.75 5.5H19.25"
                  stroke="black"
                  strokeOpacity="0.8"
                  strokeWidth="1.83"
                  strokeLinecap="round"
                />
                <path
                  d="M2.75 11H19.25"
                  stroke="black"
                  strokeOpacity="0.8"
                  strokeWidth="1.83"
                  strokeLinecap="round"
                />
                <path
                  d="M2.75 16.5H19.25"
                  stroke="black"
                  strokeOpacity="0.8"
                  strokeWidth="1.83"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-black/08 flex flex-col">
          {NAV_ITEMS.map(({ label, items }) => (
            <div key={label} className="border-b border-black/06">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-[15px] text-black/75"
                style={{ fontFamily: T.poppins }}
                onClick={() => {
                  if (items) {
                    setMobileExpandedNav(
                      mobileExpandedNav === label ? null : label,
                    );
                  } else {
                    setActiveNav(label);
                    setMobileMenuOpen(false);
                  }
                }}
              >
                {label}
                {items && (
                  <ChevronDown
                    size={16}
                    className={`opacity-40 transition-transform duration-200 ${mobileExpandedNav === label ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {items && mobileExpandedNav === label && (
                <div className="flex flex-col pb-2">
                  {(() => {
                    const shortcutMap: Record<string, string> = {
                      Tienda: "Todos los productos",
                      Novedades: "Todas las novedades",
                      Regalos: "Todos los regalos",
                      "Nuestra historia": "Conoce nuestra historia",
                      Contacto: "Información de contacto",
                    };
                    const shortcut = shortcutMap[label];
                    if (!shortcut) return null;
                    return (
                      <button
                        className="text-left px-8 py-2.5 text-[14px] text-black/75 hover:text-black/90 transition-colors"
                        style={{ fontFamily: T.poppins, fontWeight: 500 }}
                        onClick={() => {
                          setActiveNav(label);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {shortcut}
                      </button>
                    );
                  })()}
                  {items.map((item) => (
                    <button
                      key={item}
                      className="text-left px-8 py-2.5 text-[14px] text-black/50 hover:text-black/80 transition-colors"
                      style={{ fontFamily: T.poppins }}
                      onClick={() => {
                        setActiveNav(label);
                        onSubNavClick(item);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
