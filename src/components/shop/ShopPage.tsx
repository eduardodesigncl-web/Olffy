// @ts-nocheck
import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Product } from "../../contracts/product.types";
import { ProductCard } from "./ProductCard";

const C = {
  orange: "#e94300",
  purple: "#5957b0",
  yellow: "#fab405",
  cream: "#fff5d9",
};
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

const CATEGORIES = [
  "Todos",
  "Agendas y planners",
  "Cuadernos",
  "Stickers",
  "Tarjetas",
  "Marcapáginas",
  "Accesorios",
];
const SORT_OPTIONS = [
  "Más recientes",
  "Precio: menor a mayor",
  "Precio: mayor a menor",
  "Más vendidos",
];

interface ShopPageProps {
  products: Product[];
  onAddToCart: (productId: string, variantId: string) => void;
  onProductClick?: (product: Product) => void;
}

export function ShopPage({
  products,
  onAddToCart,
  onProductClick,
}: ShopPageProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("Más recientes");
  const [showSort, setShowSort] = useState(false);

  const filtered = products
    .filter((p) => activeCategory === "Todos" || p.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === "Precio: menor a mayor") return a.price - b.price;
      if (sortBy === "Precio: mayor a menor") return b.price - a.price;
      return 0;
    });

  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <div
        className="w-full bg-[#eee] relative overflow-hidden"
        style={{ minHeight: 220 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#f2e0cc]/90 to-transparent" />
        <div
          className="relative px-6 md:px-16 py-12 md:py-16 flex flex-col justify-center"
          style={{ minHeight: 220 }}
        >
          <p
            className="text-[11px] tracking-[0.2em] uppercase mb-2 text-black/40"
            style={{ fontFamily: T.poppins }}
          >
            Nuestra colección
          </p>
          <h1
            className="leading-tight text-black/80"
            style={{
              fontFamily: T.ivy,
              fontStyle: "italic",
              fontSize: "clamp(26px, 3.5vw, 52px)",
              fontWeight: 300,
            }}
          >
            Toda la
          </h1>
          <h1
            className="leading-[0.9] mb-4"
            style={{
              fontFamily: T.piepie,
              fontSize: "clamp(40px, 5vw, 76px)",
              color: C.orange,
              letterSpacing: "-0.02em",
            }}
          >
            Tienda
          </h1>
          <p
            className="text-[14px] text-black/50 max-w-[340px]"
            style={{ fontFamily: T.poppins }}
          >
            Papelería ilustrada para organizar, crear y regalar con magia.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="sticky top-0 z-10 bg-white border-b border-black/10">
        {/* Mobile: scrollable categories */}
        <div
          className="flex md:hidden items-center gap-2 px-4 py-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <SlidersHorizontal size={14} className="text-black/35 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-[12px] border shrink-0 transition-all"
              style={{
                fontFamily: T.poppins,
                background: activeCategory === cat ? C.orange : "white",
                color: activeCategory === cat ? "#fff" : "rgba(0,0,0,0.7)",
                borderColor:
                  activeCategory === cat ? C.orange : "rgba(0,0,0,0.15)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex md:hidden items-center justify-between px-4 pb-3 border-t border-black/5">
          <p
            className="text-[12px] text-black/40"
            style={{ fontFamily: T.poppins }}
          >
            {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="relative">
            <button
              onClick={() => setShowSort((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] text-black/60"
              style={{ fontFamily: T.poppins, borderColor: "rgba(0,0,0,0.15)" }}
            >
              {sortBy}{" "}
              <ChevronDown
                size={13}
                className={`transition-transform ${showSort ? "rotate-180" : ""}`}
              />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-black/10 py-1 min-w-[200px] z-20">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setShowSort(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-black/70 hover:bg-black/5 transition-colors"
                    style={{
                      fontFamily: T.poppins,
                      fontWeight: opt === sortBy ? 600 : 400,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between gap-4 px-16 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="flex items-center gap-1.5 text-[13px] text-black/40 mr-2"
              style={{ fontFamily: T.poppins }}
            >
              <SlidersHorizontal size={14} /> Filtrar:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-full text-[13px] border transition-all"
                style={{
                  fontFamily: T.poppins,
                  background: activeCategory === cat ? C.orange : "white",
                  color: activeCategory === cat ? "#fff" : "rgba(0,0,0,0.7)",
                  borderColor:
                    activeCategory === cat ? C.orange : "rgba(0,0,0,0.15)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSort((v) => !v)}
              className="flex items-center gap-2 px-4 py-1.5 rounded border text-[13px] text-black/70 hover:border-black/40 transition-colors"
              style={{ fontFamily: T.poppins, borderColor: "rgba(0,0,0,0.2)" }}
            >
              {sortBy}{" "}
              <ChevronDown
                size={14}
                className={`transition-transform ${showSort ? "rotate-180" : ""}`}
              />
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-black/10 py-1 min-w-[180px] z-20">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setShowSort(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-black/70 hover:bg-black/5 transition-colors"
                    style={{
                      fontFamily: T.poppins,
                      fontWeight: opt === sortBy ? 600 : 400,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop counter */}
      <div className="hidden md:block px-16 pt-6 pb-2">
        <p
          className="text-[13px] text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "Todos" && (
            <>
              {" "}
              en <span className="text-black/60">{activeCategory}</span>
            </>
          )}
        </p>
      </div>

      {/* Grid */}
      <div
        className="px-4 md:px-16 pt-4 md:pt-6 pb-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8"
        data-bind="shopify-products"
      >
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAddToCart}
            onClick={onProductClick}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-6 py-16 text-center">
          <p
            className="text-[15px] text-black/40"
            style={{ fontFamily: T.poppins }}
          >
            No hay productos en esta categoría.
          </p>
          <button
            onClick={() => setActiveCategory("Todos")}
            className="mt-4 text-[14px] underline"
            style={{ fontFamily: T.poppins, color: C.orange }}
          >
            Ver todos
          </button>
        </div>
      )}
    </div>
  );
}
