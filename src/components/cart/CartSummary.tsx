// @ts-nocheck
import type { Cart } from "../../contracts/cart.types";

const C = { orange: "#e94300" };
const T = { poppins: "'Poppins', sans-serif" };
const FREE_SHIPPING_THRESHOLD = 30000;
const SHIPPING = 3990;

interface CartSummaryProps {
  cart: Cart;
  onCheckout: () => void;
}

export function CartSummary({ cart, onCheckout }: CartSummaryProps) {
  const freeShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING;
  const total = cart.subtotal + shipping - cart.discountAmount;

  return (
    <div className="flex flex-col gap-4">
      {/* Free shipping progress */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-black/3">
        {freeShipping ? (
          <p
            className="text-[13px] text-green-600"
            style={{ fontFamily: T.poppins }}
          >
            ¡Tienes envío gratis! 🎉
          </p>
        ) : (
          <>
            <p
              className="text-[12px] text-black/55"
              style={{ fontFamily: T.poppins }}
            >
              Te faltan $
              {(FREE_SHIPPING_THRESHOLD - cart.subtotal).toLocaleString(
                "es-CL",
              )}{" "}
              para envío gratis
            </p>
            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                  background: C.orange,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[14px]">
          <span className="text-black/55" style={{ fontFamily: T.poppins }}>
            Subtotal
          </span>
          <span className="text-black/80" style={{ fontFamily: T.poppins }}>
            ${cart.subtotal.toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-black/55" style={{ fontFamily: T.poppins }}>
            Envío
          </span>
          <span
            className={freeShipping ? "text-green-600" : "text-black/80"}
            style={{ fontFamily: T.poppins }}
          >
            {freeShipping ? "Gratis" : `$${shipping.toLocaleString("es-CL")}`}
          </span>
        </div>
        {cart.discountAmount > 0 && (
          <div className="flex justify-between text-[14px]">
            <span className="text-black/55" style={{ fontFamily: T.poppins }}>
              Descuento {cart.discountCode ? `(${cart.discountCode})` : ""}
            </span>
            <span className="text-green-600" style={{ fontFamily: T.poppins }}>
              -${cart.discountAmount.toLocaleString("es-CL")}
            </span>
          </div>
        )}
        <div className="flex justify-between text-[16px] pt-2 border-t border-black/10">
          <span
            className="text-black/80 font-medium"
            style={{ fontFamily: T.poppins }}
          >
            Total
          </span>
          <span
            style={{ fontFamily: T.poppins, fontWeight: 700, color: C.orange }}
          >
            ${total.toLocaleString("es-CL")}
          </span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="w-full py-3.5 rounded-full text-white text-[15px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{ fontFamily: T.poppins, background: C.orange }}
        data-action="go-checkout"
      >
        Ir al checkout →
      </button>
      <p
        className="text-center text-[11px] text-black/30"
        style={{ fontFamily: T.poppins }}
      >
        Pago seguro con SSL · Devolucion en 30 días
      </p>
    </div>
  );
}
