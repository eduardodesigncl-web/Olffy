// @ts-nocheck
import { User, ShoppingBag, Star, Gift, LogOut } from "lucide-react";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

type Screen = "dashboard" | "history" | "rewards" | "redemptions";

interface AccountSidebarProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  customerName?: string;
  points?: number;
}

const ITEMS: { id: Screen; label: string; Icon: typeof User }[] = [
  { id: "dashboard", label: "Inicio", Icon: User },
  { id: "history", label: "Mis pedidos", Icon: ShoppingBag },
  { id: "rewards", label: "Recompensas", Icon: Star },
  { id: "redemptions", label: "Mis canjes", Icon: Gift },
];

export function AccountSidebar({
  active,
  onNavigate,
  onLogout,
  customerName,
  points = 0,
}: AccountSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-black/8 bg-white min-h-full">
      <div className="px-6 pt-8 pb-6 border-b border-black/6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-3"
          style={{ background: C.purple }}
        >
          <User size={20} />
        </div>
        <p
          className="text-[16px] text-black/80 truncate"
          style={{ fontFamily: T.poppins, fontWeight: 500 }}
        >
          {customerName ?? "Mi cuenta"}
        </p>
        <p
          className="text-[13px] mt-0.5"
          style={{ fontFamily: T.poppins, color: C.orange }}
        >
          {points.toLocaleString("es-CL")} puntos
        </p>
      </div>
      <nav className="flex flex-col py-4 flex-1">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex items-center gap-3 px-6 py-3 text-[14px] transition-colors text-left"
              style={{
                fontFamily: T.poppins,
                background: isActive ? "#fff5d9" : "transparent",
                color: isActive ? C.orange : "rgba(0,0,0,0.55)",
                fontWeight: isActive ? 500 : 400,
                borderRight: isActive
                  ? `3px solid ${C.orange}`
                  : "3px solid transparent",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-6 py-4 text-[13px] text-black/35 hover:text-red-500 transition-colors border-t border-black/6"
        style={{ fontFamily: T.poppins }}
      >
        <LogOut size={14} /> Cerrar sesión
      </button>
    </aside>
  );
}
