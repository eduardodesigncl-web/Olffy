import type { SupportConversation, SupportMessage } from "./types";
import {
  isCustomerOnline,
  normalizeSupportIssueCategory,
  normalizeSupportStatus,
} from "./workflow";

export function mapSupportMessage(
  row: Record<string, unknown>,
): SupportMessage {
  return {
    id: Number(row.id),
    conversationId: String(row.conversation_id),
    sender:
      row.sender === "admin" || row.sender === "system"
        ? row.sender
        : "customer",
    senderId: row.sender_id ? String(row.sender_id) : null,
    senderName:
      String(row.sender_name ?? "").trim() ||
      (row.sender === "admin"
        ? "Administración OLFFY"
        : row.sender === "system"
          ? "Sistema"
          : "Cliente"),
    body: String(row.body ?? ""),
    deliveryChannel:
      row.delivery_channel === "chat_and_email" ||
      row.delivery_channel === "chat_email"
        ? "chat_and_email"
        : "chat",
    emailStatus:
      row.email_status === "pending" ||
      row.email_status === "sent" ||
      row.email_status === "failed"
        ? row.email_status
        : "not_required",
    emailedAt: row.emailed_at ? String(row.emailed_at) : null,
    emailError: row.email_error ? String(row.email_error) : null,
    emailProviderId: row.email_provider_id
      ? String(row.email_provider_id)
      : null,
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
    reference: `SUP-${Number(row.reference_number ?? row.customer_id)}`,
    status: normalizeSupportStatus(row.status),
    unreadAdmin: Number(row.unread_admin ?? 0),
    unreadCustomer: Number(row.unread_customer ?? 0),
    lastMessageAt: String(row.last_message_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    customerLastSeenAt: row.customer_last_seen_at
      ? String(row.customer_last_seen_at)
      : null,
    customerOnline: isCustomerOnline(
      row.customer_last_seen_at ? String(row.customer_last_seen_at) : null,
    ),
    handledByAdminId: row.handled_by_admin_id
      ? String(row.handled_by_admin_id)
      : null,
    handledByAdminName: row.handled_by_admin_name
      ? String(row.handled_by_admin_name)
      : null,
    handledByAdminEmail: row.handled_by_admin_email
      ? String(row.handled_by_admin_email)
      : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    resolvedByAdminName: row.resolved_by_admin_name
      ? String(row.resolved_by_admin_name)
      : null,
    relatedOrderName: row.related_order_name
      ? String(row.related_order_name)
      : null,
    issueCategory: normalizeSupportIssueCategory(row.issue_category),
    issueSubcategory: row.issue_subcategory
      ? String(row.issue_subcategory)
      : null,
    diagnosedAt: row.diagnosed_at ? String(row.diagnosed_at) : null,
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    messages,
  };
}
