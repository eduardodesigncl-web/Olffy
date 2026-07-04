// @ts-nocheck
import { useState } from "react";
import { Search, Plus, Minus, Check } from "lucide-react";
import type { Customer } from "../../contracts/customer.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface AdminCustomerPageProps {
  customers: Customer[];
  onAdjustPoints: (customerId: string, amount: number, reason: string) => void;
  onCreateRedemption: (customerId: string, rewardId: string) => void;
}

export function AdminCustomerPage({
  customers,
  onAdjustPoints,
  onCreateRedemption,
}: AdminCustomerPageProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [reason, setReason] = useState("");
  const [adjusted, setAdjusted] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdjust(sign: 1 | -1) {
    if (!selected || !adjustAmount) return;
    onAdjustPoints(selected.id, sign * parseInt(adjustAmount), reason);
    setAdjusted(true);
    setTimeout(() => {
      setAdjusted(false);
      setAdjustAmount("");
      setReason("");
    }, 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Clientes
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Gestionar puntos y canjes
        </p>
      </div>
      <div className="relative">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
        />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-customers"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl border text-left transition-all hover:border-orange-300 hover:bg-orange-50"
            style={{
              borderColor:
                selected?.id === c.id ? C.orange : "rgba(0,0,0,0.08)",
              background: selected?.id === c.id ? "#fff5d9" : "white",
            }}
          >
            <div className="flex flex-col">
              <p
                className="text-[14px] text-black/75"
                style={{ fontFamily: T.poppins, fontWeight: 500 }}
              >
                {c.name}
              </p>
              <p
                className="text-[12px] text-black/35"
                style={{ fontFamily: T.poppins }}
              >
                {c.email}
              </p>
            </div>
            <span
              className="text-[13px] font-medium"
              style={{ fontFamily: T.poppins, color: C.purple }}
            >
              {c.points} pts
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p
            className="text-center text-[14px] text-black/30 py-8"
            style={{ fontFamily: T.poppins }}
          >
            Sin resultados
          </p>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="flex flex-col gap-5 p-6 rounded-2xl border border-black/10 bg-white mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[18px] text-black/80"
                style={{ fontFamily: T.piepie }}
              >
                {selected.name}
              </p>
              <p
                className="text-[13px] text-black/40"
                style={{ fontFamily: T.poppins }}
              >
                {selected.email}
              </p>
            </div>
            <span
              className="text-[22px]"
              style={{ fontFamily: T.piepie, color: C.purple }}
            >
              {selected.points} pts
            </span>
          </div>

          {/* Adjust points */}
          <div className="flex flex-col gap-3 pt-4 border-t border-black/6">
            <p
              className="text-[14px] text-black/60 font-medium"
              style={{ fontFamily: T.poppins }}
            >
              Ajustar puntos
            </p>
            <input
              type="number"
              min="1"
              placeholder="Cantidad de puntos"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
              style={{ fontFamily: T.poppins }}
            />
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
              style={{ fontFamily: T.poppins }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAdjust(1)}
                disabled={!adjustAmount}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all hover:opacity-90"
                style={{ fontFamily: T.poppins, background: C.orange }}
                data-action="adjust-points"
              >
                {adjusted ? (
                  <>
                    <Check size={14} />
                    Guardado
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Sumar puntos
                  </>
                )}
              </button>
              <button
                onClick={() => handleAdjust(-1)}
                disabled={!adjustAmount}
                className="flex-1 py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-1.5 border disabled:opacity-40 transition-all hover:bg-red-50"
                style={{
                  fontFamily: T.poppins,
                  borderColor: "rgba(0,0,0,0.15)",
                  color: "#dc2626",
                }}
                data-action="adjust-points"
              >
                <Minus size={14} />
                Restar puntos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
