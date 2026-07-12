// @ts-nocheck
import { ShoppingBag, Star, Gift, ArrowRight } from "lucide-react";
import type { Customer } from "../../contracts/customer.types";

const C = { orange: "#e94300", purple: "#5957b0", cream: "#fff5d9" };
const T = {
  piepie: "'PiepieW01-Regular', sans-serif",
  poppins: "'Poppins', sans-serif",
};

interface AccountDashboardProps {
  customer: Customer;
  onNavigate: (section: "history" | "rewards" | "redemptions") => void;
}

export function AccountDashboard({
  customer,
  onNavigate,
}: AccountDashboardProps) {
  const pointsToNextReward =
    customer.points >= 1000 ? 0 : 1000 - customer.points;

  return (
    <div className="flex flex-col gap-8">
      {/* Points hero */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-10 text-white"
        style={{ background: C.purple }}
        data-bind="customer-points"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)",
          }}
        />
        <div className="relative flex flex-col gap-1">
          <p
            className="text-[13px] tracking-wider opacity-70"
            style={{ fontFamily: T.poppins }}
          >
            Tus puntos OLFFY
          </p>
          <p
            className="text-[56px] leading-none"
            style={{ fontFamily: T.piepie }}
          >
            {customer.points.toLocaleString("es-CL")}
          </p>
          {pointsToNextReward > 0 ? (
            <p
              className="text-[13px] opacity-65 mt-1"
              style={{ fontFamily: T.poppins }}
            >
              Te faltan {pointsToNextReward} puntos para tu próximo canje
            </p>
          ) : (
            <p
              className="text-[13px] opacity-80 mt-1"
              style={{ fontFamily: T.poppins }}
            >
              ¡Tienes suficientes puntos para canjear! 🎉
            </p>
          )}
          {/* Progress bar */}
          <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${Math.min(100, (customer.points / 1000) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            label: "Pedidos",
            value: customer.ordersCount,
            Icon: ShoppingBag,
            onClick: () => onNavigate("history"),
          },
          {
            label: "Puntos",
            value: customer.points,
            Icon: Star,
            onClick: () => onNavigate("rewards"),
          },
          {
            label: "Canjes",
            value: customer.redemptionsCount ?? 0,
            Icon: Gift,
            onClick: () => onNavigate("redemptions"),
          },
        ].map(({ label, value, Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col gap-2 p-5 rounded-2xl border border-black/8 text-left hover:border-black/20 hover:shadow-md transition-all group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: C.cream }}
            >
              <Icon size={18} style={{ color: C.orange }} />
            </div>
            <div>
              <p
                className="text-[24px] text-black/80"
                style={{ fontFamily: T.piepie }}
              >
                {value}
              </p>
              <p
                className="text-[13px] text-black/45"
                style={{ fontFamily: T.poppins }}
              >
                {label}
              </p>
            </div>
            <ArrowRight
              size={14}
              className="text-black/25 group-hover:text-black/50 group-hover:translate-x-1 transition-all self-end mt-auto"
            />
          </button>
        ))}
      </div>

      {/* Quick info */}
      <div className="flex flex-col gap-3 p-5 rounded-2xl border border-black/8">
        <p
          className="text-[15px] text-black/70"
          style={{ fontFamily: T.poppins, fontWeight: 500 }}
        >
          Información de cuenta
        </p>
        <div className="flex flex-col gap-1.5 text-[14px]">
          {[
            ["Nombre", customer.name],
            ["Correo", customer.email],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-black/40" style={{ fontFamily: T.poppins }}>
                {k}
              </span>
              <span className="text-black/70" style={{ fontFamily: T.poppins }}>
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
