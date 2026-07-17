"use client";

import { useRouter } from "next/navigation";
import { signOutCustomerAction } from "app/cuenta/actions";
import type {
  Order,
  PuntosTab,
  Redemption,
  RewardTier,
  Transaction,
} from "../components/puntos";
import {
  PuntosPage,
  type PuntosCustomerData,
  type PuntosRuleInfo,
} from "../pages/PuntosPage";
import {
  changeCustomerPasswordAction,
  redeemCustomerRewardAction,
  updateCustomerProfileAction,
} from "./account-actions";
import { CustomerSupportChat } from "../components/account/CustomerSupportChat";

export interface PuntosPanelData {
  customer: PuntosCustomerData;
  transactions: Transaction[];
  orders: Order[];
  rewards: RewardTier[];
  redemptions: Redemption[];
  rules: string[];
  ruleInfo: PuntosRuleInfo;
  expiringNotice: { points: number; dateLabel: string | null } | null;
  initialTab?: PuntosTab;
}

export function PuntosPanelClient(data: PuntosPanelData) {
  const router = useRouter();

  return (
    <>
      <PuntosPage
        customer={data.customer}
        transactions={data.transactions}
        orders={data.orders}
        rewards={data.rewards}
        redemptions={data.redemptions}
        rules={data.rules}
        ruleInfo={data.ruleInfo}
        expiringNotice={data.expiringNotice}
        {...(data.initialTab ? { initialTab: data.initialTab } : {})}
        onRedeem={async (reward) => {
          const result = await redeemCustomerRewardAction({
            rewardId: reward.id,
            requestId: crypto.randomUUID(),
          });
          if (result.ok) {
            router.refresh();
            return { ok: true };
          }
          return { ok: false, error: result.error };
        }}
        onSignOut={() => signOutCustomerAction()}
        onUpdateProfile={async (input) => {
          const result = await updateCustomerProfileAction(input);
          if (result.ok) router.refresh();
          return result;
        }}
        onChangePassword={(input) => changeCustomerPasswordAction(input)}
      />
      <CustomerSupportChat />
    </>
  );
}
