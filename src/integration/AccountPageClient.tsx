"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AccountDashboard } from "../components/customer/AccountDashboard";
import { AccountSidebar } from "../components/customer/AccountSidebar";
import { HistoryPage } from "../components/customer/HistoryPage";
import { RedemptionsPage } from "../components/customer/RedemptionsPage";
import { RewardsPage } from "../components/customer/RewardsPage";
import type { Customer, PointsTransaction } from "../contracts/customer.types";
import type { Redemption, Reward } from "../contracts/loyalty.types";
import { logoutCustomer } from "../adapters/frontend-actions";
import { requestRewardByIdAction } from "./actions";

type Screen = "dashboard" | "history" | "rewards" | "redemptions";

const routes: Record<Screen, string> = {
  dashboard: "/cuenta",
  history: "/cuenta/historial",
  rewards: "/cuenta/recompensas",
  redemptions: "/cuenta/canjes",
};

export function AccountPageClient({
  screen,
  customer,
  transactions,
  rewards,
  redemptions,
}: {
  screen: Screen;
  customer: Customer;
  transactions: PointsTransaction[];
  rewards: Reward[];
  redemptions: Redemption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="min-h-[70vh] bg-white flex">
      <AccountSidebar
        active={screen}
        customerName={(customer as any).name ?? customer.fullName}
        points={(customer as any).points ?? customer.pointsBalance}
        onNavigate={(next) => router.push(routes[next])}
        onLogout={() =>
          startTransition(async () => {
            await logoutCustomer();
            router.push("/cuenta/login?signedOut=1");
            router.refresh();
          })
        }
      />
      <div className="flex-1 px-6 md:px-10 py-8">
        {screen === "dashboard" && (
          <AccountDashboard
            customer={customer}
            onNavigate={(next) => router.push(routes[next])}
          />
        )}
        {screen === "history" && <HistoryPage transactions={transactions} />}
        {screen === "rewards" && (
          <RewardsPage
            customer={customer}
            rewards={rewards}
            onRedeem={(rewardId) =>
              startTransition(() => void requestRewardByIdAction(rewardId))
            }
          />
        )}
        {screen === "redemptions" && (
          <RedemptionsPage redemptions={redemptions} />
        )}
      </div>
    </div>
  );
}
