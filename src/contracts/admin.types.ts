export interface AdminDashboard {
  productsCount: number;
  activeProducts: number;
  draftProducts: number;
  collectionsCount: number;
  customersCount: number;
  activeCustomersCount: number;
  physicalSalesCount: number;
  physicalSalesTotal: number;
  outstandingPoints: number;
  redemptionsCount: number;
  pendingRedemptions: number;
  recentSales: PhysicalSale[];
  lowStockProducts: { id: string; title: string; stock: number }[];
}

export interface PhysicalSale {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  amount: number;
  pointsEarned: number;
  paymentMethod: "tuu" | "cash" | "transfer";
  boletaStatus: "issued" | "pending" | "failed" | "retrying";
  boletaFolio?: string;
  date: string;
  operatorName: string;
}
