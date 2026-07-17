import { describe, expect, it } from "vitest";
import { mapSupportConversation, mapSupportMessage } from "./mappers";

describe("support mappers", () => {
  it("maps customer and admin messages without exposing database columns", () => {
    const message = mapSupportMessage({
      id: 7,
      conversation_id: "conversation-1",
      sender: "admin",
      body: "Respuesta OLFFY",
      delivery_channel: "chat_email",
      email_status: "sent",
      created_at: "2026-07-17T15:00:00.000Z",
      email_error: "private provider detail",
    });

    expect(message).toEqual({
      id: 7,
      conversationId: "conversation-1",
      sender: "admin",
      body: "Respuesta OLFFY",
      deliveryChannel: "chat_email",
      emailStatus: "sent",
      createdAt: "2026-07-17T15:00:00.000Z",
    });
  });

  it("maps unread counters for the correct audience", () => {
    const conversation = mapSupportConversation(
      {
        id: "conversation-1",
        customer_id: 42,
        customer_email: "cliente@olffy.cl",
        customer_name: "Cliente",
        status: "answered",
        unread_admin: 0,
        unread_customer: 1,
        last_message_at: "2026-07-17T15:00:00.000Z",
      },
      [],
    );

    expect(conversation.status).toBe("answered");
    expect(conversation.unreadAdmin).toBe(0);
    expect(conversation.unreadCustomer).toBe(1);
  });
});
