// @ts-nocheck
import Image from "next/image";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "../../contracts/product.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = { poppins: "'Poppins', sans-serif" };

interface ProductCardProps {
  product: Product;
  onAdd: (productId: string, variantId: string) => void;
  onClick?: (product: Product) => void;
}

export function ProductCard({ product, onAdd, onClick }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    setAdded(true);
    onAdd(product.id, product.variantId);
    setTimeout(() => setAdded(false), 1500);
  }

  const tag = product.tags.find((t) => t === "Nuevo" || t === "Favorito");

  return (
    <div
      className="flex flex-col gap-3 group cursor-pointer"
      onClick={() => onClick?.(product)}
    >
      <div className="relative overflow-hidden rounded-lg bg-[#eee] aspect-[3/4]">
        {tag && (
          <span
            className="absolute top-3 left-3 px-2 py-0.5 text-[11px] rounded text-white z-10"
            style={{
              fontFamily: T.poppins,
              background: tag === "Favorito" ? C.purple : C.orange,
            }}
          >
            {tag}
          </span>
        )}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-md"
          style={{
            fontFamily: T.poppins,
            background: added ? "#16a34a" : C.orange,
          }}
          data-action="add-to-cart"
        >
          {added ? (
            <span className="flex items-center gap-1">
              <Check size={13} /> Agregado
            </span>
          ) : (
            "Agregar al carro"
          )}
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        <p
          className="text-[14px] text-black/80 truncate"
          style={{ fontFamily: T.poppins }}
        >
          {product.title}
        </p>
        <p
          className="text-[15px] text-black/90"
          style={{ fontFamily: T.poppins, fontWeight: 600 }}
        >
          ${product.price.toLocaleString("es-CL")}
        </p>
      </div>
    </div>
  );
}
