// @ts-nocheck
import { useState } from "react";
import type { Redemption } from "../../contracts/loyalty.types";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = { poppins: "'Poppins', sans-serif" };

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  approved: { bg: "#dcfce7", text: "#16a34a", label: "Aprobado" },
  requested: { bg: "#fef3c7", text: "#d97706", label: "Pendiente" },
  rejected: { bg: "#fee2e2", text: "#dc2626", label: "Rechazado" },
  used: { bg: "#ede9fe", text: "#7c3aed", label: "Utilizado" },
  delivered: { bg: "#ede9fe", text: "#7c3aed", label: "Utilizado" },
  cancelled: { bg: "#fee2e2", text: "#dc2626", label: "Cancelado" },
};

interface RedemptionCardProps {
  redemption: Redemption;
}

export function RedemptionCard({ redemption }: RedemptionCardProps) {
  const [copied, setCopied] = useState(false);
  const cfg = STATUS_CONFIG[redemption.status] ?? {
    bg: "#f3f4f6",
    text: "#6b7280",
    label: redemption.status,
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-black/8">
      <div className="flex flex-col gap-0.5 flex-1">
        <p
          className="text-[14px] text-black/75"
          style={{ fontFamily: T.poppins }}
        >
          {redemption.rewardTitle}
        </p>
        <p
          className="text-[12px] text-black/35"
          style={{ fontFamily: T.poppins }}
        >
          {new Date(redemption.createdAt).toLocaleDateString("es-CL")} ·{" "}
          {redemption.pointsUsed} pts
        </p>
        {redemption.code && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code
              className="text-[13px] font-mono tracking-wider"
              style={{ color: C.orange }}
            >
              {redemption.code}
            </code>
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1 text-[11px] text-black/60 hover:bg-black/5"
              onClick={async () => {
                await navigator.clipboard.writeText(redemption.code!);
                setCopied(true);
              }}
            >
              {copied ? "Copiado ✓" : "Copiar código"}
            </button>
          </div>
        )}
      </div>
      <span
        className="px-3 py-1 rounded-full text-[12px] whitespace-nowrap"
        style={{ fontFamily: T.poppins, background: cfg.bg, color: cfg.text }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
