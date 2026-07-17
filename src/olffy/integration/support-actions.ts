"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { requireCustomerAccount } from "lib/customer/auth";
import {
  getCustomerSupportOrders,
  getShopifyShopSummary,
} from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { sendSupportEmail } from "lib/support/email";
import { mapSupportConversation, mapSupportMessage } from "lib/support/mappers";
import type {
  SupportConversation,
  SupportIssueCategory,
  SupportStatus,
} from "lib/support/types";
import {
  isValidSupportSubcategory,
  normalizeSupportIssueCategory,
  normalizeSupportStatus,
  sanitizeSupportEmailError,
  statusAfterCustomerMessage,
  supportIssueCategoryLabel,
} from "lib/support/workflow";

type SupportActionResult =
  | { ok: true; conversation: SupportConversation | null }
  | { ok: false; error: string };

const CONVERSATION_FIELDS =
  "id,reference_number,customer_id,customer_email,customer_name,status,unread_admin,unread_customer,last_message_at,created_at,updated_at,customer_last_seen_at,handled_by_admin_id,handled_by_admin_name,handled_by_admin_email,resolved_at,resolved_by_admin_name,related_order_name,issue_category,issue_subcategory,diagnosed_at,archived_at";
const MESSAGE_FIELDS =
  "id,conversation_id,sender,sender_id,sender_name,body,delivery_channel,email_status,emailed_at,email_error,email_provider_id,created_at";

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
    .order("id", { ascending: true })
    .limit(300);

  if (messagesError) throw new Error(messagesError.message);

  if (markCustomerRead) {
    await supabase
      .from("support_conversations")
      .update({
        unread_customer: 0,
      })
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

async function ensureConversation(
  customer: {
    id: number;
    email: string;
    full_name: string | null;
  },
  diagnosis: {
    category: SupportIssueCategory;
    subcategory: string;
  } | null,
) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: findError } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (existing) return { conversation: existing, created: false };

  if (!diagnosis) {
    throw new Error("Selecciona el motivo de tu consulta para continuar.");
  }

  const { data, error } = await supabase
    .from("support_conversations")
    .insert({
      customer_id: customer.id,
      customer_email: customer.email.trim().toLowerCase(),
      customer_name: customer.full_name,
      customer_last_seen_at: new Date().toISOString(),
      issue_category: diagnosis.category,
      issue_subcategory: diagnosis.subcategory,
      diagnosed_at: new Date().toISOString(),
    })
    .select(CONVERSATION_FIELDS)
    .single();

  if (!error) return { conversation: data, created: true };
  if (error.code !== "23505") throw new Error(error.message);

  const { data: concurrent, error: concurrentError } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .eq("customer_id", customer.id)
    .single();

  if (concurrentError) throw new Error(concurrentError.message);
  return { conversation: concurrent, created: false };
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

async function rememberRelatedOrder(
  conversationId: string,
  customerEmail: string,
) {
  try {
    const orders = await getCustomerSupportOrders(customerEmail);
    const related = orders.find((order) => order.active) ?? orders[0];
    if (!related) return null;
    await getSupabaseAdmin()
      .from("support_conversations")
      .update({
        related_order_id: related.id,
        related_order_name: related.name,
      })
      .eq("id", conversationId);
    return related.name;
  } catch (cause) {
    console.error("No se pudo asociar el pedido a soporte:", cause);
    return null;
  }
}

async function insertSystemEvent(
  conversationId: string,
  body: string,
  senderName = "Sistema",
) {
  const { error } = await getSupabaseAdmin().from("support_messages").insert({
    conversation_id: conversationId,
    sender: "system",
    sender_name: senderName,
    body,
    delivery_channel: "chat",
    email_status: "not_required",
  });
  if (error) throw new Error(error.message);
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
  category?: SupportIssueCategory;
  subcategory?: string;
}): Promise<SupportActionResult> {
  const { customer } = await requireCustomerAccount();
  const body = input.message?.trim();

  if (!body || body.length > 2000) {
    return {
      ok: false,
      error: "Escribe un mensaje de hasta 2.000 caracteres.",
    };
  }

  const category = normalizeSupportIssueCategory(input.category);
  const subcategory = String(input.subcategory ?? "").trim();
  const diagnosis =
    category && isValidSupportSubcategory(category, subcategory)
      ? { category, subcategory }
      : null;
  if ((input.category || input.subcategory) && !diagnosis) {
    return {
      ok: false,
      error: "Selecciona una opción válida para identificar tu consulta.",
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { conversation, created } = await ensureConversation(
      customer,
      diagnosis,
    );
    const previousStatus = normalizeSupportStatus(
      conversation.status,
    ) as SupportStatus;
    if (previousStatus === "resolved" && !diagnosis) {
      return {
        ok: false,
        error: "Selecciona el motivo de la nueva consulta para continuar.",
      };
    }
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

    if (created) {
      await insertSystemEvent(
        conversation.id,
        `Consulta iniciada: ${supportIssueCategoryLabel(diagnosis?.category)} · ${diagnosis?.subcategory}.`,
      );
    } else if (previousStatus === "resolved") {
      await insertSystemEvent(
        conversation.id,
        diagnosis
          ? `Nueva consulta: ${supportIssueCategoryLabel(diagnosis.category)} · ${diagnosis.subcategory}.`
          : "La consulta fue reabierta por una nueva respuesta de la clienta.",
      );
    }
    if (conversation.archived_at) {
      await insertSystemEvent(
        conversation.id,
        "La conversación volvió a la bandeja activa por una nueva respuesta del cliente.",
      );
    }

    const now = new Date().toISOString();
    const { data: message, error: insertError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender: "customer",
        sender_id: String(customer.id),
        sender_name: customer.full_name || "Cliente",
        body,
        request_id: randomUUID(),
        delivery_channel: "chat_and_email",
        email_status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    const nextStatus = statusAfterCustomerMessage(previousStatus);
    const diagnosisUpdate = diagnosis
      ? {
          issue_category: diagnosis.category,
          issue_subcategory: diagnosis.subcategory,
          diagnosed_at: now,
        }
      : {};
    const reopenUpdate =
      previousStatus === "resolved"
        ? {
            handled_by_admin_id: null,
            handled_by_admin_name: null,
            handled_by_admin_email: null,
            last_replied_by_admin_id: null,
            resolved_at: null,
            resolved_by_admin_id: null,
            resolved_by_admin_name: null,
          }
        : {};
    const { error: updateError } = await supabase
      .from("support_conversations")
      .update({
        customer_email: customer.email.trim().toLowerCase(),
        customer_name: customer.full_name,
        customer_last_seen_at: now,
        status: nextStatus,
        unread_admin: Number(conversation.unread_admin ?? 0) + 1,
        last_message_at: now,
        updated_at: now,
        archived_at: null,
        archived_by_admin_id: null,
        archived_by_admin_name: null,
        ...diagnosisUpdate,
        ...reopenUpdate,
      })
      .eq("id", conversation.id);

    if (updateError) throw new Error(updateError.message);

    if ((created || previousStatus === "resolved") && diagnosis) {
      await insertSystemEvent(
        conversation.id,
        `¡Gracias, ${customer.full_name || "cliente OLFFY"}! Recibimos tu consulta sobre ${supportIssueCategoryLabel(diagnosis.category).toLowerCase()} (${diagnosis.subcategory}). El equipo revisará el caso #SUP-${conversation.reference_number} y te responderá a la brevedad por este chat. Si no estás conectado, también te avisaremos por correo.`,
        "Ayuda OLFFY",
      );
    }

    after(async () => {
      const [recipient, relatedOrderName] = await Promise.all([
        supportRecipient(),
        rememberRelatedOrder(conversation.id, customer.email),
      ]);
      const emailResult = recipient
        ? await sendSupportEmail({
            to: recipient,
            replyTo: customer.email,
            idempotencyKey: `support-customer-message-${message.id}`,
            subject: `Nueva consulta ${`#SUP-${conversation.reference_number}`} · ${customer.full_name || customer.email}`,
            heading: "Nueva consulta desde Mi cuenta",
            body: `${customer.full_name || "Cliente OLFFY"} (${customer.email}) escribió:\n\n${body}${diagnosis ? `\n\nMotivo: ${supportIssueCategoryLabel(diagnosis.category)} · ${diagnosis.subcategory}` : ""}${relatedOrderName ? `\n\nPedido relacionado: ${relatedOrderName}` : ""}`,
          })
        : {
            sent: false as const,
            error: "No hay correo de soporte configurado.",
          };

      const { error: emailUpdateError } = await getSupabaseAdmin()
        .from("support_messages")
        .update({
          email_status: emailResult.sent ? "sent" : "failed",
          emailed_at: emailResult.sent ? new Date().toISOString() : null,
          email_provider_id: emailResult.sent ? emailResult.providerId : null,
          email_error: emailResult.sent
            ? null
            : sanitizeSupportEmailError(emailResult.error),
        })
        .eq("id", message.id);
      if (emailUpdateError) {
        console.error(
          "No se pudo registrar el resultado del aviso de soporte:",
          emailUpdateError,
        );
      }
    });

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
