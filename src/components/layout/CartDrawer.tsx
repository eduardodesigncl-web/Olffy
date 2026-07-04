// @ts-nocheck
import Image from "next/image";
import { X, ShoppingBag } from "lucide-react";
import type { CartLine } from "../../contracts/cart.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  poppins: "'Poppins', sans-serif",
};

interface CartDrawerProps {
  lines: CartLine[];
  onClose: () => void;
  onRemove: (lineId: string) => void;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  lines,
  onClose,
  onRemove,
  onIncrement,
  onDecrement,
  onCheckout,
}: CartDrawerProps) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      data-bind="shopify-cart"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-80 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
          <p className="text-[20px]" style={{ fontFamily: T.piepie }}>
            Carrito
          </p>
          <button
            onClick={onClose}
            className="text-black/60 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-black/40">
              <ShoppingBag size={40} />
              <p className="text-sm" style={{ fontFamily: T.poppins }}>
                Tu carrito está vacío
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lines.map((line) => (
                <div
                  key={line.lineId}
                  className="flex items-center justify-between gap-3 py-3 border-b border-black/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-[#eee] rounded flex-shrink-0 overflow-hidden">
                      {line.image && (
                        <Image
                          src={line.image}
                          alt={line.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm text-black/80"
                        style={{ fontFamily: T.poppins }}
                      >
                        {line.title}
                      </p>
                      <p
                        className="text-xs text-black/40"
                        style={{ fontFamily: T.poppins }}
                      >
                        x{line.quantity} · $
                        {(line.price * line.quantity).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(line.lineId)}
                    className="text-black/30 hover:text-black/70 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {lines.length > 0 && (
          <div className="px-6 py-5 border-t border-black/10">
            <div className="flex justify-between mb-3">
              <p
                className="text-[14px] text-black/50"
                style={{ fontFamily: T.poppins }}
              >
                Subtotal
              </p>
              <p
                className="text-[14px] text-black/80"
                style={{ fontFamily: T.poppins, fontWeight: 500 }}
              >
                ${subtotal.toLocaleString("es-CL")}
              </p>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-3 rounded-full text-white transition-opacity hover:opacity-90"
              style={{
                fontFamily: T.poppins,
                fontWeight: 500,
                background: C.orange,
              }}
              data-action="go-checkout"
            >
              Ir al checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
