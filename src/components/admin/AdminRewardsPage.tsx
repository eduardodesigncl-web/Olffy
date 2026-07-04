// @ts-nocheck
import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Redemption } from "../../contracts/loyalty.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface AdminRewardsPageProps {
  redemptions: Redemption[];
  onApprove: (redemptionId: string) => void;
  onReject: (redemptionId: string) => void;
}

export function AdminRewardsPage({
  redemptions,
  onApprove,
  onReject,
}: AdminRewardsPageProps) {
  const pending = redemptions.filter((r) => r.status === "requested");
  const resolved = redemptions.filter((r) => r.status !== "requested");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Canjes
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          {pending.length} pendiente{pending.length !== 1 ? "s" : ""} de aprobar
        </p>
      </div>

      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <p
            className="text-[14px] text-black/55 font-medium"
            style={{ fontFamily: T.poppins }}
          >
            Pendientes de aprobación
          </p>
          {pending.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 p-4 rounded-2xl border-2"
              style={{ borderColor: "#fef3c7", background: "#fffbeb" }}
            >
              <div>
                <p
                  className="text-[14px] text-black/75"
                  style={{ fontFamily: T.poppins, fontWeight: 500 }}
                >
                  {r.rewardTitle}
                </p>
                <p
                  className="text-[12px] text-black/40 mt-0.5"
                  style={{ fontFamily: T.poppins }}
                >
                  {r.customerId} · {r.pointsUsed} pts ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("es-CL")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove(r.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ background: "#16a34a" }}
                  data-action="approve-redemption"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => onReject(r.id)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                  data-action="reject-redemption"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="flex flex-col gap-3">
          <p
            className="text-[14px] text-black/55 font-medium"
            style={{ fontFamily: T.poppins }}
          >
            Historial
          </p>
          {resolved.map((r) => {
            const isBad = r.status === "rejected";
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-black/8"
              >
                <div>
                  <p
                    className="text-[13px] text-black/70"
                    style={{ fontFamily: T.poppins }}
                  >
                    {r.rewardTitle}
                  </p>
                  <p
                    className="text-[11px] text-black/35 mt-0.5"
                    style={{ fontFamily: T.poppins }}
                  >
                    {new Date(r.createdAt).toLocaleDateString("es-CL")} ·{" "}
                    {r.pointsUsed} pts
                  </p>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: T.poppins,
                    background: isBad ? "#fee2e2" : "#dcfce7",
                    color: isBad ? "#dc2626" : "#16a34a",
                  }}
                >
                  {isBad ? "Rechazado" : "Aprobado"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {redemptions.length === 0 && (
        <p
          className="text-[14px] text-black/30 py-10 text-center"
          style={{ fontFamily: T.poppins }}
        >
          No hay canjes registrados
        </p>
      )}
    </div>
  );
}
