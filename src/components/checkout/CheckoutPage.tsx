// @ts-nocheck
import Image from "next/image";
import { useState } from "react";
import {
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Package,
} from "lucide-react";
import type { CartLine } from "../../contracts/cart.types";
import type { CheckoutForm } from "../../contracts/checkout.types";

const C = { orange: "#e94300", purple: "#5957b0", cream: "#fff5d9" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  poppins: "'Poppins', sans-serif",
};
const SHIPPING = 3990;

const EXTRAS = [
  { id: "ex1", title: "Papel regalo", price: 790 },
  { id: "ex2", title: "Tarjeta", price: 490 },
  { id: "ex3", title: "Taquito notas", price: 890 },
  { id: "ex4", title: "Sobre kraft", price: 390 },
  { id: "ex5", title: "Sticker sorpresa", price: 290 },
  { id: "ex6", title: "Bolsa organza", price: 590 },
  { id: "ex7", title: "Marcapáginas", price: 390 },
  { id: "ex8", title: "Nota adhesiva", price: 190 },
];
const PROMO_CODES: Record<string, number> = { OLFFY10: 0.1, BIENVENIDA: 0.15 };

interface CheckoutPageProps {
  lines: CartLine[];
  onSuccess?: (orderId: string) => void;
  onBack?: () => void;
  onSubmitCheckout?: (form: CheckoutForm) => Promise<void>;
}

export function CheckoutPage({
  lines,
  onSuccess,
  onBack,
  onSubmitCheckout,
}: CheckoutPageProps) {
  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    zipCode: "",
    paymentMethod: "webpay",
    acceptTerms: false,
  });
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof CheckoutForm>(k: K, v: CheckoutForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function toggleExtra(id: string) {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function applyPromo() {
    const code = promoCode.toUpperCase();
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError("");
    } else {
      setPromoError("Código inválido");
      setAppliedPromo(null);
    }
  }

  const subtotal = lines.reduce(
    (s, l) => s + l.price * (qtyMap[l.lineId] ?? l.quantity),
    0,
  );
  const extraTotal = extras.reduce((s, id) => {
    const e = EXTRAS.find((x) => x.id === id);
    return s + (e?.price ?? 0);
  }, 0);
  const discount = appliedPromo
    ? Math.round((subtotal + extraTotal) * PROMO_CODES[appliedPromo])
    : 0;
  const total = subtotal + extraTotal + SHIPPING - discount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.acceptTerms) return;
    setLoading(true);
    if (onSubmitCheckout) {
      await onSubmitCheckout(form);
      setLoading(false);
      return;
    }
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onSuccess?.(
        "ORD-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
      );
    }, 1500);
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-6 py-16">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "#d1fae5" }}
        >
          <Check size={36} className="text-green-600" />
        </div>
        <div className="text-center flex flex-col gap-2 max-w-xs">
          <h2
            style={{
              fontFamily: T.piepie,
              fontSize: 32,
              color: "rgba(0,0,0,0.85)",
            }}
          >
            ¡Pedido realizado!
          </h2>
          <p
            className="text-[15px] text-black/50"
            style={{ fontFamily: T.poppins }}
          >
            Te enviaremos un correo con la confirmación de tu pedido y el
            seguimiento de tu envío.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-full text-white text-[14px]"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          Volver a la tienda →
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white min-h-screen px-4 md:px-16 py-8 md:py-12"
      data-bind="shopify-checkout"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] text-black/40 hover:text-black mb-6 transition-colors"
        style={{ fontFamily: T.poppins }}
      >
        <ChevronLeft size={14} /> Volver al carrito
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Form */}
        <form className="flex-1 flex flex-col gap-8" onSubmit={handleSubmit}>
          {/* Items summary */}
          <div className="flex flex-col gap-3">
            <h2
              className="text-[20px] text-black/80"
              style={{ fontFamily: T.piepie }}
            >
              Mi pedido
            </h2>
            {lines.map((l) => {
              const qty = qtyMap[l.lineId] ?? l.quantity;
              return (
                <div
                  key={l.lineId}
                  className="flex items-center justify-between gap-3 py-2 border-b border-black/6"
                >
                  <div className="relative w-12 h-12 rounded-lg bg-[#f0f0f0] flex-shrink-0 overflow-hidden">
                    {l.image && (
                      <Image
                        src={l.image}
                        alt={l.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span
                    className="flex-1 text-[14px] text-black/70 truncate"
                    style={{ fontFamily: T.poppins }}
                  >
                    {l.title}
                  </span>
                  <div className="flex items-center gap-1 border border-black/12 rounded-full overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setQtyMap((m) => ({
                          ...m,
                          [l.lineId]: Math.max(1, qty - 1),
                        }))
                      }
                      className="w-6 h-6 flex items-center justify-center text-black/40 hover:text-black"
                    >
                      <Minus size={11} />
                    </button>
                    <span
                      className="w-5 text-center text-[12px]"
                      style={{ fontFamily: T.poppins }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQtyMap((m) => ({ ...m, [l.lineId]: qty + 1 }))
                      }
                      className="w-6 h-6 flex items-center justify-center text-black/40 hover:text-black"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <span
                    className="text-[14px] text-black/70 w-24 text-right"
                    style={{ fontFamily: T.poppins }}
                  >
                    ${(l.price * qty).toLocaleString("es-CL")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Extras */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-black/40" />
              <h3
                className="text-[16px] text-black/80"
                style={{ fontFamily: T.piepie }}
              >
                Extras para tu pedido
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EXTRAS.map((ex) => {
                const selected = extras.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleExtra(ex.id)}
                    className="flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all"
                    style={{
                      borderColor: selected ? C.orange : "rgba(0,0,0,0.10)",
                      background: selected ? "#fff5d9" : "white",
                    }}
                  >
                    <span
                      className="text-[13px] text-black/70"
                      style={{ fontFamily: T.poppins }}
                    >
                      {ex.title}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ fontFamily: T.poppins, color: C.orange }}
                    >
                      +${ex.price.toLocaleString("es-CL")}
                    </span>
                    {selected && (
                      <Check
                        size={12}
                        className="absolute top-2 right-2"
                        style={{ color: C.orange }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shipping info */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-[18px] text-black/80"
              style={{ fontFamily: T.piepie }}
            >
              Datos de envío
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["firstName", "Nombre"],
                ["lastName", "Apellido"],
              ].map(([k, l]) => (
                <input
                  key={k}
                  type="text"
                  placeholder={l}
                  required
                  value={(form as any)[k]}
                  onChange={(e) => setField(k as any, e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40 transition-colors"
                  style={{ fontFamily: T.poppins }}
                />
              ))}
              <input
                type="email"
                placeholder="Correo"
                required
                className="col-span-2 px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
                style={{ fontFamily: T.poppins }}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
              <input
                type="tel"
                placeholder="Teléfono"
                className="col-span-2 px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
                style={{ fontFamily: T.poppins }}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
              <input
                type="text"
                placeholder="Dirección"
                required
                className="col-span-2 px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
                style={{ fontFamily: T.poppins }}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
              <input
                type="text"
                placeholder="Ciudad"
                required
                className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
                style={{ fontFamily: T.poppins }}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
              <input
                type="text"
                placeholder="Región"
                className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
                style={{ fontFamily: T.poppins }}
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
              />
            </div>
          </div>

          {/* Promo code */}
          <div className="flex flex-col gap-2">
            <h3
              className="text-[16px] text-black/70"
              style={{ fontFamily: T.piepie }}
            >
              Código de descuento
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código promo"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoError("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40 uppercase"
                style={{ fontFamily: T.poppins }}
              />
              <button
                type="button"
                onClick={applyPromo}
                className="px-4 py-2.5 rounded-xl border text-[14px] hover:bg-black/4 transition-colors"
                style={{
                  fontFamily: T.poppins,
                  borderColor: "rgba(0,0,0,0.15)",
                }}
              >
                Aplicar
              </button>
            </div>
            {appliedPromo && (
              <p
                className="text-[12px] text-green-600"
                style={{ fontFamily: T.poppins }}
              >
                Código aplicado: {appliedPromo} (
                {PROMO_CODES[appliedPromo] * 100}% de descuento)
              </p>
            )}
            {promoError && (
              <p
                className="text-[12px] text-red-500"
                style={{ fontFamily: T.poppins }}
              >
                {promoError}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => setField("acceptTerms", e.target.checked)}
                className="w-4 h-4 accent-orange-500"
                required
              />
              <span
                className="text-[13px] text-black/50"
                style={{ fontFamily: T.poppins }}
              >
                Acepto los términos y condiciones
              </span>
            </label>
            <button
              type="submit"
              disabled={!form.acceptTerms || loading}
              className="w-full py-4 rounded-full text-white text-[16px] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontFamily: T.poppins, background: C.orange }}
              data-action="confirm-checkout"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  <span>Confirmar pedido</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Order summary sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="sticky top-6 flex flex-col gap-4 p-6 rounded-2xl border border-black/8">
            <h3
              className="text-[18px] text-black/80"
              style={{ fontFamily: T.piepie }}
            >
              Resumen
            </h3>
            <div className="flex flex-col gap-2 text-[14px]">
              <div
                className="flex justify-between text-black/55"
                style={{ fontFamily: T.poppins }}
              >
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString("es-CL")}</span>
              </div>
              {extraTotal > 0 && (
                <div
                  className="flex justify-between text-black/55"
                  style={{ fontFamily: T.poppins }}
                >
                  <span>Extras</span>
                  <span>${extraTotal.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div
                className="flex justify-between text-black/55"
                style={{ fontFamily: T.poppins }}
              >
                <span>Envío</span>
                <span>${SHIPPING.toLocaleString("es-CL")}</span>
              </div>
              {discount > 0 && (
                <div
                  className="flex justify-between text-green-600"
                  style={{ fontFamily: T.poppins }}
                >
                  <span>Descuento</span>
                  <span>-${discount.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div
                className="flex justify-between text-[16px] pt-2 border-t border-black/8 font-semibold"
                style={{ fontFamily: T.poppins }}
              >
                <span>Total</span>
                <span style={{ color: C.orange }}>
                  ${total.toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
