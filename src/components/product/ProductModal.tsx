// @ts-nocheck
import Image from "next/image";
import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import type {
  ProductDetail,
  ProductBundle,
} from "../../contracts/product.types";

const C = { orange: "#e94300", purple: "#5957b0", cream: "#fff5d9" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  ivy: "'IvyPresto Text', Georgia, serif",
  poppins: "'Poppins', sans-serif",
};

interface ProductModalProps {
  product: ProductDetail;
  bundles?: ProductBundle[];
  onClose: () => void;
  onAddToCart: (productId: string, variantId: string, quantity: number) => void;
}

export function ProductModal({
  product,
  bundles = [],
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(
    product.options?.[0]?.values?.[0] ?? "",
  );
  const [selectedVariantId, setSelectedVariantId] = useState(product.variantId);
  const [adding, setAdding] = useState(false);

  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  function handleAdd() {
    if (adding) return;
    setAdding(true);
    onAddToCart(product.id, selectedVariantId, qty);
    setTimeout(() => setAdding(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-bind="shopify-product-detail"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
          <span
            className="text-[12px] uppercase tracking-wider text-black/35"
            style={{ fontFamily: T.poppins }}
          >
            {product.category}
          </span>
          <button
            onClick={onClose}
            className="text-black/40 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Image gallery */}
          <div
            className="md:w-[55%] bg-[#f5f5f5] relative"
            style={{ minHeight: 380 }}
          >
            {images.length > 0 ? (
              <Image
                src={images[imgIdx]}
                alt={product.title}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-black/15">
                <svg
                  viewBox="0 0 24 24"
                  width={48}
                  height={48}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setImgIdx((i) => (i - 1 + images.length) % images.length)
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        height: 6,
                        width: i === imgIdx ? 18 : 6,
                        background:
                          i === imgIdx ? C.orange : "rgba(0,0,0,0.25)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 px-6 py-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <h2
                style={{
                  fontFamily: T.ivy,
                  fontStyle: "italic",
                  fontSize: 26,
                  fontWeight: 300,
                  color: "rgba(0,0,0,0.85)",
                }}
              >
                {product.title}
              </h2>
              <p
                className="mt-1 text-[22px]"
                style={{
                  fontFamily: T.poppins,
                  fontWeight: 600,
                  color: C.orange,
                }}
              >
                ${product.price.toLocaleString("es-CL")}
              </p>
            </div>

            {product.description && (
              <p
                className="text-[14px] text-black/55 leading-relaxed"
                style={{ fontFamily: T.poppins }}
              >
                {product.description}
              </p>
            )}

            {/* Color options */}
            {product.options && product.options.length > 0 && (
              <div className="flex flex-col gap-2">
                <p
                  className="text-[12px] text-black/40 uppercase tracking-wider"
                  style={{ fontFamily: T.poppins }}
                >
                  Color
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.options[0].values.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedColor(v)}
                      className="px-3 py-1 rounded-full text-[12px] border transition-all"
                      style={{
                        fontFamily: T.poppins,
                        background: selectedColor === v ? C.orange : "white",
                        color: selectedColor === v ? "#fff" : "rgba(0,0,0,0.7)",
                        borderColor:
                          selectedColor === v ? C.orange : "rgba(0,0,0,0.15)",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p
                  className="text-[12px] text-black/40 uppercase tracking-wider"
                  style={{ fontFamily: T.poppins }}
                >
                  Especificaciones
                </p>
                <div className="flex flex-col gap-1">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[13px]">
                      <span
                        className="text-black/45"
                        style={{ fontFamily: T.poppins }}
                      >
                        {k}
                      </span>
                      <span
                        className="text-black/70"
                        style={{ fontFamily: T.poppins }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add */}
            <div className="flex items-center gap-3 mt-auto pt-3 border-t border-black/8">
              <div className="flex items-center gap-0.5 border border-black/15 rounded-full overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-black/50 hover:text-black transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span
                  className="w-8 text-center text-[15px]"
                  style={{ fontFamily: T.poppins }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-black/50 hover:text-black transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 py-2.5 rounded-full text-white text-[14px] font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{
                  fontFamily: T.poppins,
                  background: adding ? "#16a34a" : C.orange,
                }}
                data-action="add-to-cart"
              >
                <ShoppingCart size={16} />
                {adding ? "¡Añadido!" : "Añadir al carrito"}
              </button>
            </div>

            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="flex flex-col gap-3 pt-3 border-t border-black/8">
                <p
                  className="text-[12px] text-black/40 uppercase tracking-wider"
                  style={{ fontFamily: T.poppins }}
                >
                  Combinar con
                </p>
                <div className="flex flex-col gap-2">
                  {bundles.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-black/3 transition-colors"
                      style={{ background: C.cream }}
                    >
                      <span
                        className="text-[13px] text-black/70"
                        style={{ fontFamily: T.poppins }}
                      >
                        {b.title}
                      </span>
                      <span
                        className="text-[13px]"
                        style={{
                          fontFamily: T.poppins,
                          color: C.orange,
                          fontWeight: 600,
                        }}
                      >
                        ${b.bundlePrice.toLocaleString("es-CL")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
