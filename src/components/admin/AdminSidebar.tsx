// @ts-nocheck
import {
  LayoutDashboard,
  Users,
  Star,
  Package,
  Grid,
  TrendingUp,
  LogOut,
} from "lucide-react";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

type AdminSection =
  | "dashboard"
  | "clientes"
  | "puntos"
  | "productos"
  | "colecciones"
  | "ventas"
  | "canjes";

const ITEMS: {
  id: AdminSection;
  label: string;
  Icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", Icon: Users },
  { id: "puntos", label: "Puntos", Icon: Star },
  { id: "productos", label: "Productos", Icon: Package },
  { id: "colecciones", label: "Colecciones", Icon: Grid },
  { id: "ventas", label: "Ventas físicas", Icon: TrendingUp },
  { id: "canjes", label: "Canjes", Icon: Star },
];

interface AdminSidebarProps {
  active: AdminSection;
  onNavigate: (s: AdminSection) => void;
  onLogout: () => void;
}

export function AdminSidebar({
  active,
  onNavigate,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="w-56 min-h-full bg-white border-r border-black/8 flex flex-col flex-shrink-0">
      <div className="px-6 py-6 border-b border-black/6">
        <p style={{ fontFamily: T.piepie, fontSize: 18, color: C.purple }}>
          Admin
        </p>
        <p
          className="text-[12px] text-black/35 mt-0.5"
          style={{ fontFamily: T.poppins }}
        >
          olffy.cl
        </p>
      </div>
      <nav className="flex flex-col py-3 flex-1">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex items-center gap-2.5 px-5 py-2.5 text-[13px] text-left transition-colors"
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
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-5 py-4 text-[13px] text-black/30 hover:text-red-500 transition-colors border-t border-black/6"
        style={{ fontFamily: T.poppins }}
      >
        <LogOut size={14} /> Salir
      </button>
    </aside>
  );
}
