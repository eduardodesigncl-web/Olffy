import type { SupportConversation, SupportMessage } from "./types";

export function mapSupportMessage(
  row: Record<string, unknown>,
): SupportMessage {
  return {
    id: Number(row.id),
    conversationId: String(row.conversation_id),
    sender: row.sender === "admin" ? "admin" : "customer",
    body: String(row.body ?? ""),
    deliveryChannel:
      row.delivery_channel === "chat_email" ? "chat_email" : "chat",
    emailStatus:
      row.email_status === "pending" ||
      row.email_status === "sent" ||
      row.email_status === "failed"
        ? row.email_status
        : "not_requested",
    createdAt: String(row.created_at),
  };
}

export function mapSupportConversation(
  row: Record<string, unknown>,
  messages: SupportMessage[],
): SupportConversation {
  return {
    id: String(row.id),
    customerId: Number(row.customer_id),
    customerEmail: String(row.customer_email),
    customerName: row.customer_name ? String(row.customer_name) : null,
    status:
      row.status === "open" ||
      row.status === "answered" ||
      row.status === "closed"
        ? row.status
        : "new",
    unreadAdmin: Number(row.unread_admin ?? 0),
    unreadCustomer: Number(row.unread_customer ?? 0),
    lastMessageAt: String(row.last_message_at),
    messages,
  };
}
