"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ProductCard } from "./product-card";
import type { OlffyProduct } from "./data";
import { useMemo, useState } from "react";

const preferredCategories = [
  "Todos",
  "Cuadernos",
  "Planners",
  "Stickers",
  "Papelería",
  "Escritura",
  "Calendarios",
  "Regalos",
];

function normalizeCategory(category: string) {
  const lowered = category.toLowerCase();

  if (lowered.includes("cuaderno") || lowered.includes("libreta")) {
    return "Cuadernos";
  }
  if (lowered.includes("planner") || lowered.includes("agenda")) {
    return "Planners";
  }
  if (lowered.includes("sticker")) return "Stickers";
  if (lowered.includes("regalo") || lowered.includes("kit")) return "Regalos";
  if (lowered.includes("calendario")) return "Calendarios";
  if (lowered.includes("escritura") || lowered.includes("lapiz")) {
    return "Escritura";
  }

  return "Papelería";
}

export function StoreProductBrowser({
  products,
  initialQuery = "",
  initialCategory = "Todos",
}: {
  products: OlffyProduct[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const productsWithCategory = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        normalizedCategory: normalizeCategory(product.category),
      })),
    [products],
  );
  const categories = preferredCategories;
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return productsWithCategory.filter((product) => {
      const categoryMatches =
        activeCategory === "Todos" ||
        product.normalizedCategory === activeCategory;
      const queryMatches =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return categoryMatches && queryMatches;
    });
  }, [activeCategory, productsWithCategory, searchQuery]);

  return (
    <section
      id="productos"
      className="mx-auto max-w-[1240px] px-4 py-[clamp(36px,4.5vw,56px)] lg:px-12"
    >
      <div className="mb-[clamp(22px,3vw,36px)]">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
          PAPELERÍA ILUSTRADA · CHILE
        </div>
        <h1 className="m-0 font-brand text-[clamp(34px,5vw,58px)] font-black leading-none tracking-[-0.02em] text-olffy-ink">
          Tienda OLFFY
        </h1>
        <p className="mt-2 text-[15.5px] text-olffy-ink/60">
          {filteredProducts.length} producto
          {filteredProducts.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mb-[26px] flex flex-wrap items-center gap-[13px]">
        <label className="relative max-w-[340px] flex-1 basis-[220px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-olffy-ink/40" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            type="text"
            placeholder="Buscar productos..."
            className="w-full rounded-xl border-[1.5px] border-olffy-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm text-olffy-ink outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const active = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={
                  active
                    ? "rounded-full border border-olffy-ink bg-olffy-ink px-4 py-2 text-[12.5px] font-semibold text-white"
                    : "rounded-full border border-olffy-ink/15 bg-white px-4 py-2 text-[12.5px] font-medium text-olffy-ink hover:border-olffy-orange"
                }
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-olffy-ink/45">
          <div className="mb-3 text-4xl">🔍</div>
          <div className="mb-1 text-[17px] font-semibold text-olffy-ink">
            Sin resultados
          </div>
          <div className="text-sm">Prueba con otra búsqueda o categoría</div>
        </div>
      )}
    </section>
  );
}
