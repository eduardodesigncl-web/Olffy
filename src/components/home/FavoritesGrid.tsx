// @ts-nocheck
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import type { Product } from "../../contracts/product.types";

const C = { orange: "#e94300" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

interface FavoritesGridProps {
  products: Product[];
  onAddToCart: (productId: string, variantId: string) => void;
  onViewAll?: () => void;
}

export function FavoritesGrid({
  products,
  onAddToCart,
  onViewAll,
}: FavoritesGridProps) {
  return (
    <section className="py-16 flex flex-col gap-8 bg-white">
      <div className="flex flex-col gap-2 px-6 md:px-16">
        <span
          className="text-[11px] tracking-[0.2em] uppercase text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          Los más queridos
        </span>
        <h2
          className="text-black/85 leading-none"
          style={{ fontFamily: T.piepie, fontSize: "clamp(26px, 3vw, 40px)" }}
        >
          Favoritos &amp; más esperados
        </h2>
        <button
          className="self-start text-[13px] text-black/45 hover:text-black transition-colors underline underline-offset-2 mt-1"
          style={{ fontFamily: T.poppins }}
          onClick={onViewAll}
        >
          Ver todos →
        </button>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-16"
        data-bind="shopify-products"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl overflow-hidden border group cursor-pointer transition-shadow hover:shadow-lg"
            style={{ borderColor: "rgba(0,0,0,0.07)", background: "white" }}
          >
            <div className="relative">
              <div className="relative w-full h-[200px] md:h-[240px] bg-[#eee]">
                <Image
                  src={p.image || p.images?.[0]}
                  alt={p.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <span
                className="absolute top-2 left-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: T.poppins,
                  background: "rgba(255,255,255,0.85)",
                  color: "rgba(0,0,0,0.45)",
                }}
              >
                {p.category}
              </span>
              <button
                onClick={() => onAddToCart(p.id, p.variantId)}
                className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl text-[12px] text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                style={{ fontFamily: T.poppins, background: C.orange }}
                data-action="add-to-cart"
              >
                <ShoppingCart size={12} /> Añadir
              </button>
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <p
                className="text-[14px] text-black/75 leading-snug"
                style={{ fontFamily: T.ivy, fontStyle: "italic" }}
              >
                {p.title}
              </p>
              <p
                className="text-[13px] text-black/40"
                style={{ fontFamily: T.poppins }}
              >
                ${p.price.toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
