// @ts-nocheck
import type { Reward } from "../../contracts/loyalty.types";
import type { Customer } from "../../contracts/customer.types";
import { RewardCard } from "../loyalty/RewardCard";

const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface RewardsPageProps {
  customer: Customer;
  rewards: Reward[];
  onRedeem: (rewardId: string) => void;
}

export function RewardsPage({ customer, rewards, onRedeem }: RewardsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="text-[26px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Recompensas
        </h2>
        <p
          className="text-[14px] text-black/40 mt-1"
          style={{ fontFamily: T.poppins }}
        >
          Tienes <strong>{customer.points}</strong> puntos disponibles
        </p>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-bind="loyalty-rewards"
      >
        {rewards.map((r) => (
          <RewardCard
            key={r.id}
            reward={r}
            userPoints={customer.points}
            onRedeem={() => onRedeem(r.id)}
          />
        ))}
      </div>
    </div>
  );
}
