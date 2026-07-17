export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "pending";
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}

export interface PointsTransaction {
  id: string;
  type: "earned" | "redeemed" | "adjusted" | "expired" | "reversed";
  points: number;
  balanceAfter: number;
  description: string;
  source: "shopify_order" | "tuu_sale" | "manual" | "redemption";
  date: string;
}
