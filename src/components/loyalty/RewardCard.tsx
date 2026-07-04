// @ts-nocheck
import { Lock } from "lucide-react";
import type { Reward } from "../../contracts/loyalty.types";

const C = { orange: "#e94300", purple: "#5957b0", cream: "#fff5d9" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: () => void;
}

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const canRedeem = userPoints >= reward.pointsCost;
  const progress = Math.min(100, (userPoints / reward.pointsCost) * 100);

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl border transition-shadow"
      style={{
        borderColor: canRedeem ? C.orange : "rgba(0,0,0,0.08)",
        boxShadow: canRedeem ? `0 0 0 2px ${C.orange}22` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[16px] text-black/80"
            style={{ fontFamily: T.piepie }}
          >
            {reward.title}
          </p>
          <p
            className="text-[13px] text-black/45 mt-0.5"
            style={{ fontFamily: T.poppins }}
          >
            {reward.description}
          </p>
        </div>
        {!canRedeem && (
          <Lock size={16} className="text-black/25 flex-shrink-0 mt-1" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: canRedeem ? C.orange : C.purple,
            }}
          />
        </div>
        <p
          className="text-[12px] text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          {userPoints} / {reward.pointsCost} puntos
        </p>
      </div>
      <button
        onClick={onRedeem}
        disabled={!canRedeem}
        className="py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        style={{
          fontFamily: T.poppins,
          background: canRedeem ? C.orange : "rgba(0,0,0,0.08)",
          color: canRedeem ? "#fff" : "rgba(0,0,0,0.4)",
        }}
        data-action="redeem-reward"
      >
        {canRedeem
          ? `Canjear (${reward.pointsCost} pts)`
          : `Faltan ${reward.pointsCost - userPoints} pts`}
      </button>
    </div>
  );
}
