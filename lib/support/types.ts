export type SupportSender = "customer" | "admin";

export type SupportMessage = {
  id: number;
  conversationId: string;
  sender: SupportSender;
  body: string;
  deliveryChannel: "chat" | "chat_email";
  emailStatus: "not_requested" | "pending" | "sent" | "failed";
  createdAt: string;
};

export type SupportConversation = {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string | null;
  status: "new" | "open" | "answered" | "closed";
  unreadAdmin: number;
  unreadCustomer: number;
  lastMessageAt: string;
  messages: SupportMessage[];
};
