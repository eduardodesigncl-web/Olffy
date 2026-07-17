"use server";

import { requireCustomerAccount } from "lib/customer/auth";
import { getShopifyShopSummary } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { sendSupportEmail } from "lib/support/email";
import { mapSupportConversation, mapSupportMessage } from "lib/support/mappers";
import type { SupportConversation } from "lib/support/types";

type SupportActionResult =
  | { ok: true; conversation: SupportConversation | null }
  | { ok: false; error: string };

const CONVERSATION_FIELDS =
  "id,customer_id,customer_email,customer_name,status,unread_admin,unread_customer,last_message_at,created_at,updated_at";
const MESSAGE_FIELDS =
  "id,conversation_id,sender,body,delivery_channel,email_status,created_at";

async function loadConversation(
  customerId: number,
  markCustomerRead: boolean,
): Promise<SupportConversation | null> {
  const supabase = getSupabaseAdmin();
  const { data: conversation, error } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!conversation) return null;

  const { data: messages, error: messagesError } = await supabase
    .from("support_messages")
    .select(MESSAGE_FIELDS)
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if (messagesError) throw new Error(messagesError.message);

  if (markCustomerRead && Number(conversation.unread_customer) > 0) {
    await supabase
      .from("support_conversations")
      .update({ unread_customer: 0, updated_at: new Date().toISOString() })
      .eq("id", conversation.id);
    conversation.unread_customer = 0;
  }

  return mapSupportConversation(
    conversation as Record<string, unknown>,
    (messages ?? []).map((row) =>
      mapSupportMessage(row as Record<string, unknown>),
    ),
  );
}

async function ensureConversation(customer: {
  id: number;
  email: string;
  full_name: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: findError } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("support_conversations")
    .insert({
      customer_id: customer.id,
      customer_email: customer.email.trim().toLowerCase(),
      customer_name: customer.full_name,
    })
    .select(CONVERSATION_FIELDS)
    .single();

  if (!error) return data;
  if (error.code !== "23505") throw new Error(error.message);

  const { data: concurrent, error: concurrentError } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .eq("customer_id", customer.id)
    .single();

  if (concurrentError) throw new Error(concurrentError.message);
  return concurrent;
}

async function supportRecipient() {
  const configured = process.env.SUPPORT_EMAIL_TO?.trim().toLowerCase();
  if (configured) return configured;

  try {
    return (
      (await getShopifyShopSummary()).contactEmail?.trim().toLowerCase() ?? null
    );
  } catch (cause) {
    console.error(
      "No se pudo obtener el correo de soporte desde Shopify:",
      cause,
    );
    return null;
  }
}

export async function getCustomerSupportConversationAction(input?: {
  markRead?: boolean;
}): Promise<SupportActionResult> {
  const { customer } = await requireCustomerAccount();

  try {
    return {
      ok: true,
      conversation: await loadConversation(
        customer.id,
        input?.markRead === true,
      ),
    };
  } catch (cause) {
    console.error("No se pudo cargar el chat de soporte:", cause);
    return { ok: false, error: "No pudimos cargar la conversación." };
  }
}

export async function sendCustomerSupportMessageAction(input: {
  message: string;
}): Promise<SupportActionResult> {
  const { customer } = await requireCustomerAccount();
  const body = input.message?.trim();

  if (!body || body.length > 2000) {
    return {
      ok: false,
      error: "Escribe un mensaje de hasta 2.000 caracteres.",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const conversation = await ensureConversation(customer);
    const { data: lastMessage } = await supabase
      .from("support_messages")
      .select("created_at")
      .eq("conversation_id", conversation.id)
      .eq("sender", "customer")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      lastMessage &&
      Date.now() - new Date(lastMessage.created_at).getTime() < 5000
    ) {
      return {
        ok: false,
        error: "Espera unos segundos antes de enviar otro mensaje.",
      };
    }

    const now = new Date().toISOString();
    const { data: message, error: insertError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender: "customer",
        body,
        email_status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await supabase
      .from("support_conversations")
      .update({
        customer_email: customer.email.trim().toLowerCase(),
        customer_name: customer.full_name,
        status: "new",
        unread_admin: Number(conversation.unread_admin ?? 0) + 1,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (updateError) throw new Error(updateError.message);

    const recipient = await supportRecipient();
    const emailResult = recipient
      ? await sendSupportEmail({
          to: recipient,
          replyTo: customer.email,
          subject: `Nueva consulta de ${customer.full_name || customer.email}`,
          heading: "Nueva consulta desde Mi cuenta",
          body: `${customer.full_name || "Cliente OLFFY"} (${customer.email}) escribió:\n\n${body}`,
        })
      : {
          sent: false as const,
          error: "No hay correo de soporte configurado.",
        };

    await supabase
      .from("support_messages")
      .update({
        email_status: emailResult.sent ? "sent" : "failed",
        email_error: emailResult.sent ? null : emailResult.error.slice(0, 1000),
      })
      .eq("id", message.id);

    return {
      ok: true,
      conversation: await loadConversation(customer.id, true),
    };
  } catch (cause) {
    console.error("No se pudo enviar el mensaje de soporte:", cause);
    return {
      ok: false,
      error: "No pudimos enviar tu mensaje. Intenta nuevamente.",
    };
  }
}
