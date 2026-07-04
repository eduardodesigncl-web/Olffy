// @ts-nocheck
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Check } from "lucide-react";
import type { Product } from "../../contracts/product.types";

const C = { orange: "#e94300" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (id: string, variantId: string) => void;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    setAdded(true);
    onAddToCart(product.id, product.variantId);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      className="flex flex-col shrink-0 w-[266px] group cursor-pointer rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg snap-center"
      style={{ borderColor: "rgba(0,0,0,0.07)", background: "white" }}
    >
      <div className="relative">
        <div className="relative h-[420px] w-full bg-[#eee]">
          <Image
            src={product.image || product.images?.[0]}
            alt={product.title}
            fill
            sizes="266px"
            className="object-cover"
          />
        </div>
        {product.tags.includes("Nuevo") && (
          <span
            className="absolute top-3 left-3 px-2 py-0.5 text-[11px] rounded-full text-white"
            style={{ fontFamily: T.poppins, background: C.orange }}
          >
            Nuevo
          </span>
        )}
        <button
          onClick={handleAdd}
          className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-[13px] flex items-center gap-1.5 transition-all duration-200 shadow-sm ${added ? "text-white" : "bg-white text-black/75 opacity-0 group-hover:opacity-100"}`}
          style={{
            fontFamily: T.poppins,
            ...(added ? { background: C.orange } : {}),
          }}
          data-action="add-to-cart"
        >
          {added ? (
            <>
              <Check size={13} />
              Añadido
            </>
          ) : (
            <>
              <ShoppingCart size={13} />
              Añadir
            </>
          )}
        </button>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p
          className="text-[16px] text-black/80 truncate"
          style={{ fontFamily: T.ivy, fontStyle: "italic" }}
        >
          {product.title}
        </p>
        <p
          className="text-[14px] text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          ${product.price.toLocaleString("es-CL")}
        </p>
      </div>
    </div>
  );
}

interface ProductsCarouselProps {
  products: Product[];
  onAddToCart: (productId: string, variantId: string) => void;
  onViewAll?: () => void;
}

export function ProductsCarousel({
  products,
  onAddToCart,
  onViewAll,
}: ProductsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(dir: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: dir === "left" ? -282 : 282,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-16 flex flex-col gap-10 bg-white">
      <div className="flex flex-col gap-3 px-6 md:px-16 relative">
        <span
          className="text-[11px] tracking-[0.2em] uppercase text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          Recién llegados
        </span>
        <h2
          className="text-black/85 leading-none"
          style={{ fontFamily: T.piepie, fontSize: "clamp(28px, 3vw, 42px)" }}
        >
          Nuevos productos
        </h2>
        <button
          className="self-start text-[13px] text-black/45 hover:text-black transition-colors underline underline-offset-2"
          style={{ fontFamily: T.poppins }}
          onClick={onViewAll}
        >
          Ver todos →
        </button>
      </div>

      <div className="relative px-6 md:px-16" data-bind="shopify-products">
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none", scrollPaddingLeft: "24px" }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
        <button
          onClick={() => scrollCarousel("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10 ml-1"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => scrollCarousel("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10 mr-1"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
