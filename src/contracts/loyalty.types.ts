export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountAmount: number;
  minimumPurchase: number;
  validityDays: number;
  available: boolean;
}

export interface Redemption {
  id: string;
  customerId: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  status: "requested" | "approved" | "delivered" | "cancelled";
  code?: string;
  requestedAt: string;
  approvedAt?: string;
  expiresAt?: string;
  approvedBy?: string;
}
