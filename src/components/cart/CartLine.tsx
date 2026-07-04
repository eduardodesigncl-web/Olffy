// @ts-nocheck
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartLine as CartLineType } from "../../contracts/cart.types";

const T = { poppins: "'Poppins', sans-serif" };

interface CartLineProps {
  line: CartLineType;
  onRemove: (lineId: string) => void;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
}

export function CartLine({
  line,
  onRemove,
  onIncrement,
  onDecrement,
}: CartLineProps) {
  return (
    <div className="flex gap-3 py-4 border-b border-black/8 last:border-0">
      {/* Image */}
      <div className="relative w-20 h-20 rounded-xl bg-[#eee] flex-shrink-0 overflow-hidden">
        {line.image && (
          <Image
            src={line.image}
            alt={line.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>
      {/* Info */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="text-[14px] text-black/80 leading-snug"
              style={{ fontFamily: T.poppins }}
            >
              {line.title}
            </p>
            {line.variantTitle && line.variantTitle !== "Default Title" && (
              <p
                className="text-[12px] text-black/40 mt-0.5"
                style={{ fontFamily: T.poppins }}
              >
                {line.variantTitle}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(line.lineId)}
            className="text-black/25 hover:text-red-500 transition-colors mt-0.5 flex-shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          {/* Qty controls */}
          <div className="flex items-center gap-0.5 border border-black/12 rounded-full overflow-hidden">
            <button
              onClick={() => onDecrement(line.lineId)}
              className="w-7 h-7 flex items-center justify-center text-black/40 hover:text-black transition-colors"
            >
              <Minus size={12} />
            </button>
            <span
              className="w-7 text-center text-[13px]"
              style={{ fontFamily: T.poppins }}
            >
              {line.quantity}
            </span>
            <button
              onClick={() => onIncrement(line.lineId)}
              className="w-7 h-7 flex items-center justify-center text-black/40 hover:text-black transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          <p
            className="text-[14px] font-medium text-black/80"
            style={{ fontFamily: T.poppins }}
          >
            ${(line.price * line.quantity).toLocaleString("es-CL")}
          </p>
        </div>
      </div>
    </div>
  );
}
