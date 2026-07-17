export type SupportSender = "customer" | "admin" | "system";
export type SupportDeliveryChannel = "chat" | "chat_and_email";
export type SupportStatus =
  | "new"
  | "in_progress"
  | "waiting_information"
  | "resolved";

export type SupportIssueCategory =
  | "order"
  | "payment"
  | "points"
  | "account"
  | "product"
  | "other";

export type SupportMessage = {
  id: number;
  conversationId: string;
  sender: SupportSender;
  senderId: string | null;
  senderName: string;
  body: string;
  deliveryChannel: SupportDeliveryChannel;
  emailStatus: "not_required" | "pending" | "sent" | "failed";
  emailedAt: string | null;
  emailError: string | null;
  emailProviderId: string | null;
  createdAt: string;
};

export type SupportConversation = {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string | null;
  reference: string;
  status: SupportStatus;
  unreadAdmin: number;
  unreadCustomer: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  customerLastSeenAt: string | null;
  customerOnline: boolean;
  handledByAdminId: string | null;
  handledByAdminName: string | null;
  handledByAdminEmail: string | null;
  resolvedAt: string | null;
  resolvedByAdminName: string | null;
  relatedOrderName: string | null;
  issueCategory: SupportIssueCategory | null;
  issueSubcategory: string | null;
  diagnosedAt: string | null;
  archivedAt: string | null;
  messages: SupportMessage[];
};

export type SupportCustomerProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "blocked";
  pointsBalance: number;
  memberSince: string;
  shopifyCustomerUrl: string | null;
};

export type SupportOrder = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  active: boolean;
  trackingCompany: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveryStatus: string | null;
  estimatedDeliveryAt: string | null;
  shopifyAdminUrl: string;
};

export type SupportCustomerContext = {
  customer: SupportCustomerProfile;
  activeOrder: SupportOrder | null;
  recentOrders: SupportOrder[];
  shopifyError: string | null;
};
