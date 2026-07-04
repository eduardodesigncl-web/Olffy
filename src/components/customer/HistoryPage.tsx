// @ts-nocheck
import { Package } from "lucide-react";
import type { PointsTransaction } from "../../contracts/customer.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface HistoryPageProps {
  transactions: PointsTransaction[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#16a34a",
  pending: "#d97706",
  cancelled: "#dc2626",
};
const STATUS_LABELS: Record<string, string> = {
  completed: "Completado",
  pending: "Pendiente",
  cancelled: "Cancelado",
};

export function HistoryPage({ transactions }: HistoryPageProps) {
  const purchases = transactions.filter(
    (t) => t.type === "purchase" || t.type === "earn",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Mis pedidos
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Historial de compras y seguimiento
        </p>
      </div>
      {purchases.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-black/25">
          <Package size={48} />
          <div className="text-center">
            <p
              className="text-[15px] text-black/45"
              style={{ fontFamily: T.poppins }}
            >
              No tienes pedidos aún
            </p>
            <p
              className="text-[13px] text-black/30 mt-1"
              style={{ fontFamily: T.poppins }}
            >
              Tus compras aparecerán aquí
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3" data-bind="supabase-orders">
          {purchases.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-black/8 hover:border-black/16 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-black/30" />
              </div>
              <div className="flex-1">
                <p
                  className="text-[14px] text-black/75"
                  style={{ fontFamily: T.poppins }}
                >
                  {t.description}
                </p>
                <p
                  className="text-[12px] text-black/35 mt-0.5"
                  style={{ fontFamily: T.poppins }}
                >
                  {new Date(t.createdAt).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: T.poppins,
                    background: `${STATUS_COLORS[t.status] ?? "#aaa"}22`,
                    color: STATUS_COLORS[t.status] ?? "#aaa",
                  }}
                >
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
                {t.amount && (
                  <span
                    className="text-[13px] font-medium"
                    style={{ fontFamily: T.poppins, color: C.orange }}
                  >
                    ${t.amount.toLocaleString("es-CL")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
