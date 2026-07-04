// @ts-nocheck
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { PhysicalSale } from "../../contracts/admin.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface AdminSalesPageProps {
  sales: PhysicalSale[];
  onRegisterSale: (
    customerId: string | null,
    amount: number,
    items: string[],
  ) => void;
}

export function AdminSalesPage({ sales, onRegisterSale }: AdminSalesPageProps) {
  const [amount, setAmount] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [items, setItems] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onRegisterSale(
      customerEmail || null,
      parseFloat(amount),
      items
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setAmount("");
      setCustomerEmail("");
      setItems("");
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-8" data-bind="physical-sales">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Ventas físicas
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Registro TUU / POS en tienda Viña del Mar
        </p>
      </div>

      {/* Register form */}
      <form
        className="flex flex-col gap-4 p-6 rounded-2xl border border-black/8"
        onSubmit={handleSubmit}
      >
        <p
          className="text-[15px] text-black/70 font-medium"
          style={{ fontFamily: T.poppins }}
        >
          Registrar venta
        </p>
        <input
          type="number"
          required
          placeholder="Monto total (CLP)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
          style={{ fontFamily: T.poppins }}
        />
        <input
          type="email"
          placeholder="Correo del cliente (para puntos, opcional)"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-customer-lookup"
        />
        <input
          type="text"
          placeholder="Productos vendidos (separados por coma)"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
          style={{ fontFamily: T.poppins }}
        />
        <button
          type="submit"
          className="self-start px-6 py-3 rounded-xl text-white text-[14px] flex items-center gap-2"
          style={{
            fontFamily: T.poppins,
            background: saved ? "#16a34a" : C.orange,
          }}
          data-action="register-physical-sale"
        >
          {saved ? (
            <>
              <Check size={15} />
              Guardado
            </>
          ) : (
            <>
              <Plus size={15} />
              Registrar venta
            </>
          )}
        </button>
      </form>

      {/* History */}
      <div className="flex flex-col gap-3">
        <p
          className="text-[15px] text-black/65 font-medium"
          style={{ fontFamily: T.poppins }}
        >
          Historial reciente
        </p>
        {sales.length === 0 ? (
          <p
            className="text-[14px] text-black/30 py-6 text-center"
            style={{ fontFamily: T.poppins }}
          >
            Sin registros
          </p>
        ) : (
          sales.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-black/8"
            >
              <div>
                <p
                  className="text-[14px] text-black/70"
                  style={{ fontFamily: T.poppins }}
                >
                  ${s.amount.toLocaleString("es-CL")} · {s.items.join(", ")}
                </p>
                <p
                  className="text-[12px] text-black/35 mt-0.5"
                  style={{ fontFamily: T.poppins }}
                >
                  {new Date(s.saleDate).toLocaleDateString("es-CL")}{" "}
                  {s.customerId ? "· +pts" : ""}
                </p>
              </div>
              <span
                className="text-[12px] px-2 py-0.5 rounded-full bg-green-50 text-green-700"
                style={{ fontFamily: T.poppins }}
              >
                {s.pointsIssued > 0 ? `+${s.pointsIssued} pts` : "Sin puntos"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
