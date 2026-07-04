// @ts-nocheck
import { StatCard } from "../shared/StatCard";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface AdminPointsPageProps {
  totalIssued: number;
  totalRedeemed: number;
  pendingRedemptions: number;
  onManageRedemptions: () => void;
}

export function AdminPointsPage({
  totalIssued,
  totalRedeemed,
  pendingRedemptions,
  onManageRedemptions,
}: AdminPointsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Puntos de fidelidad
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Sincronizado con Supabase
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Puntos emitidos"
          value={totalIssued.toLocaleString("es-CL")}
          sub="Total histórico"
          valueColor={C.orange}
        />
        <StatCard
          label="Puntos canjeados"
          value={totalRedeemed.toLocaleString("es-CL")}
          sub="Total histórico"
        />
        <StatCard
          label="Canjes pendientes"
          value={pendingRedemptions}
          sub="Por aprobar"
          valueColor={pendingRedemptions > 0 ? "#d97706" : undefined}
        />
      </div>
      <div className="flex flex-col gap-4 p-6 rounded-2xl border border-black/8">
        <p
          className="text-[15px] text-black/65 font-medium"
          style={{ fontFamily: T.poppins }}
        >
          Reglas del programa
        </p>
        <div className="flex flex-col gap-3 text-[14px]">
          {[
            ["Puntos por compra", "1 punto por cada $100 gastados"],
            ["Primer canje disponible", "300 puntos"],
            ["Vencimiento", "12 meses sin actividad"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 py-2 border-b border-black/5"
            >
              <span className="text-black/45" style={{ fontFamily: T.poppins }}>
                {k}
              </span>
              <span className="text-black/70" style={{ fontFamily: T.poppins }}>
                {v}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onManageRedemptions}
          className="self-start px-5 py-2.5 rounded-xl text-white text-[13px] mt-2"
          style={{ fontFamily: T.poppins, background: C.orange }}
          data-action="manage-redemptions"
        >
          Ver canjes pendientes →
        </button>
      </div>
    </div>
  );
}
