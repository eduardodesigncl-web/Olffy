// @ts-nocheck
import { StatCard } from "../shared/StatCard";
import type { AdminDashboard as AdminDashboardType } from "../../contracts/admin.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface AdminDashboardProps {
  data: AdminDashboardType;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="flex flex-col gap-8" data-bind="admin-dashboard">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Dashboard
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Resumen general del negocio
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Ventas hoy"
          value={`$${data.salesToday.toLocaleString("es-CL")}`}
          sub="Online + Físico"
          valueColor={C.orange}
        />
        <StatCard
          label="Ventas mes"
          value={`$${data.salesMonth.toLocaleString("es-CL")}`}
          sub="Este mes"
        />
        <StatCard
          label="Clientes"
          value={data.totalCustomers}
          sub="Registrados"
        />
        <StatCard
          label="Pedidos hoy"
          value={data.ordersToday}
          sub="Nuevos hoy"
          valueColor={C.purple}
        />
        <StatCard
          label="Puntos emitidos"
          value={data.totalPointsIssued.toLocaleString("es-CL")}
          sub="Total"
        />
        <StatCard
          label="Canjes pendientes"
          value={data.pendingRedemptions}
          sub="Por aprobar"
          valueColor={data.pendingRedemptions > 0 ? "#d97706" : undefined}
        />
      </div>
      <div className="p-5 rounded-2xl border border-black/8 bg-white flex flex-col gap-3">
        <p
          className="text-[15px] text-black/65 font-medium"
          style={{ fontFamily: T.poppins }}
        >
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["Aprobar canjes", "Agregar puntos", "Registrar venta"].map(
            (action) => (
              <button
                key={action}
                className="px-4 py-2.5 rounded-xl border text-[13px] text-black/60 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                style={{
                  fontFamily: T.poppins,
                  borderColor: "rgba(0,0,0,0.10)",
                }}
              >
                {action} →
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
