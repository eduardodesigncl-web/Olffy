import { randomUUID } from "node:crypto";
import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getAdminSessionActor } from "lib/admin/auth";
import {
  getCustomerSupportOrders,
  getShopifyAdminBaseUrl,
} from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { sendSupportEmail } from "lib/support/email";
import { mapSupportConversation, mapSupportMessage } from "lib/support/mappers";
import type {
  SupportCustomerContext,
  SupportDeliveryChannel,
  SupportIssueCategory,
  SupportMessage,
  SupportStatus,
} from "lib/support/types";
import {
  adminHandlerUpdate,
  buildSupportCustomerEmailBody,
  normalizeSupportStatus,
  resolveSupportSiteOrigin,
  sanitizeSupportEmailError,
  statusAfterAdminReply,
  supportDeliveryForAdminAction,
  supportDateKey,
  supportEmailIdempotencyKey,
} from "lib/support/workflow";
import { NextResponse } from "next/server";

const CONVERSATION_FIELDS =
  "id,reference_number,customer_id,customer_email,customer_name,status,unread_admin,unread_customer,last_message_at,created_at,updated_at,customer_last_seen_at,handled_by_admin_id,handled_by_admin_name,handled_by_admin_email,resolved_at,resolved_by_admin_name,related_order_name,issue_category,issue_subcategory,diagnosed_at,archived_at";
const MESSAGE_FIELDS =
  "id,conversation_id,sender,sender_id,sender_name,body,delivery_channel,email_status,emailed_at,email_error,email_provider_id,created_at";

type AdminAccount = {
  id: string;
  email: string;
  full_name: string;
};

type ConversationRow = Record<string, unknown> & {
  id: string;
  reference_number: number;
  customer_email: string;
  customer_name: string | null;
  customer_last_seen_at: string | null;
  issue_category: SupportIssueCategory | null;
  issue_subcategory: string | null;
  related_order_name: string | null;
  archived_at: string | null;
  unread_customer: number;
  status: string;
};

async function listConversations(archived = false) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .order("last_message_at", { ascending: false })
    .limit(100);
  query = archived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);
  const { data: rows, error } = await query;

  if (error) throw new Error(error.message);
  const ids = (rows ?? []).map((row) => row.id);
  let messages: SupportMessage[] = [];

  if (ids.length > 0) {
    const { data: messageRows, error: messagesError } = await supabase
      .from("support_messages")
      .select(MESSAGE_FIELDS)
      .in("conversation_id", ids)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(3000);

    if (messagesError) throw new Error(messagesError.message);
    messages = (messageRows ?? []).map((row) =>
      mapSupportMessage(row as Record<string, unknown>),
    );
  }

  return (rows ?? []).map((row) =>
    mapSupportConversation(
      row as Record<string, unknown>,
      messages.filter((message) => message.conversationId === row.id),
    ),
  );
}

async function getSupportSummary() {
  const conversations = await listConversations();
  const today = supportDateKey(new Date());
  return {
    new: conversations.filter((item) => item.status === "new").length,
    inProgress: conversations.filter((item) => item.status === "in_progress")
      .length,
    waitingInformation: conversations.filter(
      (item) => item.status === "waiting_information",
    ).length,
    resolvedToday: conversations.filter(
      (item) =>
        item.status === "resolved" &&
        item.resolvedAt &&
        supportDateKey(item.resolvedAt) === today,
    ).length,
    unread: conversations.reduce(
      (total, conversation) => total + conversation.unreadAdmin,
      0,
    ),
  };
}

async function getCustomerContext(
  conversationId: string,
): Promise<SupportCustomerContext> {
  const supabase = getSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from("support_conversations")
    .select("customer_id,customer_email,customer_name")
    .eq("id", conversationId)
    .single();

  if (conversationError) throw new Error("Conversación no encontrada");

  const { data: customer, error: customerError } = await supabase
    .from("loyalty_customers")
    .select(
      "id,email,full_name,phone,status,points_balance,created_at,shopify_customer_id",
    )
    .eq("id", conversation.customer_id)
    .single();

  if (customerError) throw new Error("No se pudo cargar el perfil del cliente");

  let recentOrders: Awaited<ReturnType<typeof getCustomerSupportOrders>> = [];
  let shopifyError: string | null = null;
  try {
    recentOrders = await getCustomerSupportOrders(
      customer.email || conversation.customer_email,
    );
    const related =
      recentOrders.find((order) => order.active) ?? recentOrders[0];
    if (related) {
      await supabase
        .from("support_conversations")
        .update({
          related_order_id: related.id,
          related_order_name: related.name,
        })
        .eq("id", conversationId);
    }
  } catch (cause) {
    console.error("No se pudieron cargar los pedidos de soporte:", cause);
    shopifyError = "Shopify no respondió al consultar pedidos";
  }

  const customerNumericId = customer.shopify_customer_id
    ? String(customer.shopify_customer_id).split("/").at(-1)
    : null;

  return {
    customer: {
      id: Number(customer.id),
      name: customer.full_name || conversation.customer_name || "Cliente OLFFY",
      email: customer.email || conversation.customer_email,
      phone: customer.phone || null,
      status: customer.status === "blocked" ? "blocked" : "active",
      pointsBalance: Number(customer.points_balance ?? 0),
      memberSince: String(customer.created_at),
      shopifyCustomerUrl: customerNumericId
        ? `${getShopifyAdminBaseUrl()}/customers/${customerNumericId}`
        : null,
    },
    activeOrder: recentOrders.find((order) => order.active) ?? null,
    recentOrders: recentOrders.slice(0, 5),
    shopifyError,
  };
}

async function requireRealAdmin(): Promise<{
  account: AdminAccount;
  name: string;
}> {
  const actor = await getAdminSessionActor();
  if (!actor?.userId || actor.legacy) {
    throw new Error(
      "Para responder soporte debes iniciar sesión con una cuenta administrativa individual.",
    );
  }

  const { data: account, error } = await getSupabaseAdmin()
    .from("admin_accounts")
    .select("id,email,full_name")
    .eq("auth_user_id", actor.userId)
    .eq("status", "active")
    .single();
  if (error || !account) throw new Error("Cuenta administrativa no válida");
  return {
    account: account as AdminAccount,
    name: account.full_name || actor.name,
  };
}

function conversationUrl(request: Request, conversationId: string) {
  const origin = resolveSupportSiteOrigin({
    nodeEnv: process.env.NODE_ENV,
    siteUrl: process.env.SITE_URL,
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    requestOrigin: new URL(request.url).origin,
  });
  const url = new URL("/cuenta", origin);
  url.searchParams.set("support", conversationId);
  return url.toString();
}

async function relatedOrderName(conversation: ConversationRow) {
  if (conversation.related_order_name)
    return String(conversation.related_order_name);
  try {
    const orders = await getCustomerSupportOrders(conversation.customer_email);
    const related = orders.find((order) => order.active) ?? orders[0];
    if (!related) return null;
    await getSupabaseAdmin()
      .from("support_conversations")
      .update({
        related_order_id: related.id,
        related_order_name: related.name,
      })
      .eq("id", conversation.id);
    return related.name;
  } catch {
    return null;
  }
}

async function deliverEmailForStoredMessage(input: {
  request: Request;
  messageId: number;
  conversation: ConversationRow;
  message: string;
  heading: string;
  subject?: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: findError } = await supabase
    .from("support_messages")
    .select("email_status,email_provider_id")
    .eq("id", input.messageId)
    .single();
  if (findError) throw new Error(findError.message);
  if (existing.email_status === "sent") {
    return { sent: true as const, alreadySent: true };
  }

  await supabase
    .from("support_messages")
    .update({
      delivery_channel: "chat_and_email",
      email_status: "pending",
      email_error: null,
    })
    .eq("id", input.messageId);

  const orderName = await relatedOrderName(input.conversation);
  const reference = `#SUP-${input.conversation.reference_number}`;
  let result;
  try {
    result = await sendSupportEmail({
      to: input.conversation.customer_email,
      idempotencyKey: supportEmailIdempotencyKey(input.messageId),
      subject:
        input.subject ||
        `Respuesta OLFFY · ${reference}${
          input.conversation.issue_subcategory
            ? ` · ${input.conversation.issue_subcategory}`
            : ""
        }`,
      heading: input.heading,
      body: buildSupportCustomerEmailBody({
        customerName: input.conversation.customer_name,
        message: input.message,
        reference,
        category: input.conversation.issue_category,
        subcategory: input.conversation.issue_subcategory,
        orderName,
      }),
      actionUrl: conversationUrl(input.request, input.conversation.id),
      actionLabel: "Volver a la conversación",
    });
  } catch (cause) {
    result = {
      sent: false as const,
      error: sanitizeSupportEmailError(cause),
    };
  }

  const emailUpdate = result.sent
    ? {
        email_status: "sent",
        emailed_at: new Date().toISOString(),
        email_provider_id: result.providerId,
        email_error: null,
      }
    : {
        email_status: "failed",
        emailed_at: null,
        email_provider_id: null,
        email_error: sanitizeSupportEmailError(result.error),
      };
  await supabase
    .from("support_messages")
    .update(emailUpdate)
    .eq("id", input.messageId);
  return result.sent
    ? { sent: true as const, alreadySent: false }
    : { sent: false as const, error: emailUpdate.email_error };
}

async function insertMessage(input: {
  conversationId: string;
  sender: "admin" | "system";
  senderId: string;
  senderName: string;
  adminAccountId: string;
  body: string;
  requestId?: string;
  deliveryChannel: SupportDeliveryChannel;
}) {
  const supabase = getSupabaseAdmin();
  const requestId = input.requestId || randomUUID();
  const row = {
    conversation_id: input.conversationId,
    sender: input.sender,
    sender_id: input.senderId,
    sender_name: input.senderName,
    admin_account_id: input.adminAccountId,
    body: input.body,
    request_id: requestId,
    delivery_channel: input.deliveryChannel,
    email_status: input.deliveryChannel === "chat" ? "not_required" : "pending",
  };
  const { data, error } = await supabase
    .from("support_messages")
    .insert(row)
    .select("id")
    .single();
  if (!error) return { id: Number(data.id), duplicate: false };
  if (error.code !== "23505") throw new Error(error.message);
  const { data: existing, error: existingError } = await supabase
    .from("support_messages")
    .select("id")
    .eq("request_id", requestId)
    .single();
  if (existingError) throw new Error(existingError.message);
  return { id: Number(existing.id), duplicate: true };
}

async function loadConversationRow(conversationId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("support_conversations")
    .select(`${CONVERSATION_FIELDS},related_order_id`)
    .eq("id", conversationId)
    .single();
  if (error) throw new Error("Conversación no encontrada");
  return data as ConversationRow;
}

async function insertSystemEvent(
  conversationId: string,
  account: AdminAccount,
  body: string,
) {
  return insertMessage({
    conversationId,
    sender: "system",
    senderId: account.id,
    senderName: "Sistema",
    adminAccountId: account.id,
    body,
    deliveryChannel: "chat",
  });
}

export async function GET(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("clientes");
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(request.url);
    if (url.searchParams.get("summary") === "1") {
      return NextResponse.json(await getSupportSummary());
    }
    const conversationId = url.searchParams.get("conversationId");
    if (conversationId) {
      return NextResponse.json({
        context: await getCustomerContext(conversationId),
      });
    }
    const conversations = await listConversations(
      url.searchParams.get("archived") === "1",
    );
    return NextResponse.json({ conversations });
  } catch (cause) {
    console.error("No se pudo cargar la bandeja de soporte:", cause);
    return NextResponse.json(
      { error: "No se pudo cargar la bandeja de consultas" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("clientes");
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as { conversationId?: string };
    const conversationId = String(body.conversationId ?? "");
    if (!conversationId) throw new Error("Conversación inválida");
    const { error } = await getSupabaseAdmin()
      .from("support_conversations")
      .update({ unread_admin: 0 })
      .eq("id", conversationId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json(
      {
        error: cause instanceof Error ? cause.message : "No se pudo actualizar",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse("clientes");
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      action?:
        | "reply"
        | "reply_chat"
        | "reply_chat_email"
        | "request_information"
        | "information_received"
        | "resolve"
        | "reopen"
        | "archive"
        | "archive_many"
        | "restore"
        | "delete_archived"
        | "delete_all_archived"
        | "retry_email";
      conversationId?: string;
      conversationIds?: string[];
      message?: string;
      messageId?: number;
      requestId?: string;
      admin_id?: unknown;
      admin_name?: unknown;
      admin_email?: unknown;
      handled_by?: unknown;
      is_online?: unknown;
    };
    const action = body.action || "reply";
    const { account, name } = await requireRealAdmin();
    const now = new Date().toISOString();

    if (
      action === "archive_many" ||
      action === "delete_archived" ||
      action === "delete_all_archived"
    ) {
      const conversationIds = [
        ...new Set(
          (Array.isArray(body.conversationIds) ? body.conversationIds : [])
            .map((id) => String(id).trim())
            .filter(Boolean),
        ),
      ].slice(0, 100);
      const supabase = getSupabaseAdmin();

      if (action === "archive_many") {
        if (conversationIds.length === 0) {
          throw new Error("Selecciona al menos una conversación");
        }
        const { data: archived, error } = await supabase
          .from("support_conversations")
          .update({
            archived_at: now,
            archived_by_admin_id: account.id,
            archived_by_admin_name: name,
            updated_at: now,
          })
          .in("id", conversationIds)
          .is("archived_at", null)
          .select("id");
        if (error) throw new Error(error.message);
        await Promise.all(
          (archived ?? []).map((item) =>
            insertSystemEvent(
              String(item.id),
              account,
              `${name} archivó la conversación mediante selección múltiple.`,
            ),
          ),
        );
        return NextResponse.json({
          ok: true,
          affectedCount: archived?.length ?? 0,
          conversations: await listConversations(),
        });
      }

      if (action === "delete_archived" && conversationIds.length === 0) {
        throw new Error("Selecciona al menos una conversación archivada");
      }
      let deleteQuery = supabase
        .from("support_conversations")
        .delete()
        .not("archived_at", "is", null);
      if (action === "delete_archived") {
        deleteQuery = deleteQuery.in("id", conversationIds);
      }
      const { data: deleted, error } = await deleteQuery.select("id");
      if (error) throw new Error(error.message);
      return NextResponse.json({
        ok: true,
        affectedCount: deleted?.length ?? 0,
        conversations: await listConversations(true),
      });
    }

    const conversationId = String(body.conversationId ?? "");
    if (!conversationId) throw new Error("Conversación inválida");
    const conversation = await loadConversationRow(conversationId);
    const currentStatus = normalizeSupportStatus(conversation.status);
    const commonUpdate = {
      ...adminHandlerUpdate({
        accountId: account.id,
        name,
        email: account.email,
      }),
      updated_at: now,
    };
    let warning: string | null = null;

    if (conversation.archived_at && action !== "restore") {
      throw new Error("Restaura la conversación antes de modificarla");
    }

    if (action === "archive") {
      await insertSystemEvent(
        conversationId,
        account,
        `${name} archivó la conversación para limpiar la bandeja de trabajo.`,
      );
      const { error } = await getSupabaseAdmin()
        .from("support_conversations")
        .update({
          archived_at: now,
          archived_by_admin_id: account.id,
          archived_by_admin_name: name,
          updated_at: now,
        })
        .eq("id", conversationId);
      if (error) throw new Error(error.message);
    } else if (action === "restore") {
      if (!conversation.archived_at) {
        throw new Error("La conversación no está archivada");
      }
      const { error } = await getSupabaseAdmin()
        .from("support_conversations")
        .update({
          archived_at: null,
          archived_by_admin_id: null,
          archived_by_admin_name: null,
          updated_at: now,
        })
        .eq("id", conversationId);
      if (error) throw new Error(error.message);
      await insertSystemEvent(
        conversationId,
        account,
        `${name} restauró la conversación a la bandeja activa.`,
      );
    } else if (action === "retry_email") {
      const messageId = Number(body.messageId);
      if (!Number.isSafeInteger(messageId) || messageId <= 0) {
        throw new Error("Mensaje inválido");
      }
      const { data: message, error } = await getSupabaseAdmin()
        .from("support_messages")
        .select("body")
        .eq("id", messageId)
        .eq("conversation_id", conversationId)
        .in("sender", ["admin", "system"])
        .single();
      if (error) throw new Error("Mensaje no encontrado");
      const result = await deliverEmailForStoredMessage({
        request,
        messageId,
        conversation,
        message: message.body,
        heading: "OLFFY respondió tu consulta",
      });
      if (!result.sent)
        warning =
          "La respuesta quedó en el chat, pero el correo no pudo enviarse";
    } else if (action === "information_received") {
      if (currentStatus !== "waiting_information") {
        throw new Error("La consulta no está esperando información");
      }
      await insertSystemEvent(
        conversationId,
        account,
        `${name} confirmó la recepción de la información enviada por correo.`,
      );
      await getSupabaseAdmin()
        .from("support_conversations")
        .update({
          ...commonUpdate,
          status: "in_progress",
          evidence_received_at: now,
          evidence_received_by: account.id,
          last_message_at: now,
        })
        .eq("id", conversationId);
    } else if (action === "reopen") {
      if (currentStatus !== "resolved")
        throw new Error("La consulta no está resuelta");
      await insertSystemEvent(
        conversationId,
        account,
        `${name} reabrió la consulta.`,
      );
      await getSupabaseAdmin()
        .from("support_conversations")
        .update({
          ...commonUpdate,
          status: "in_progress",
          resolved_at: null,
          resolved_by_admin_id: null,
          resolved_by_admin_name: null,
          last_message_at: now,
        })
        .eq("id", conversationId);
    } else {
      let message = String(body.message ?? "").trim();
      let deliveryChannel: SupportDeliveryChannel =
        action === "reply" ||
        action === "reply_chat" ||
        action === "reply_chat_email"
          ? supportDeliveryForAdminAction(
              action,
              conversation.customer_last_seen_at,
            ).deliveryChannel
          : "chat_and_email";
      let nextStatus: SupportStatus = statusAfterAdminReply(currentStatus);
      let heading = "OLFFY respondió tu consulta";

      if (action === "request_information") {
        if (currentStatus === "resolved")
          throw new Error("Reabre la consulta antes de solicitar información");
        message = `Para revisar mejor tu caso necesitamos que nos envíes las fotografías, comprobantes o documentos a Admin@olffy.cl.\n\nEn el asunto escribe Consulta #SUP-${conversation.reference_number} para que podamos relacionar la información con esta conversación.`;
        deliveryChannel = "chat_and_email";
        nextStatus = "waiting_information";
        heading = "Necesitamos información para continuar";
      } else if (action === "resolve") {
        if (currentStatus === "resolved")
          throw new Error("La consulta ya está resuelta");
        message =
          message ||
          "Marcamos tu consulta como resuelta. Si todavía necesitas ayuda, puedes responder por este mismo chat.";
        nextStatus = "resolved";
        heading = "Tu consulta fue resuelta";
      } else if (currentStatus === "resolved") {
        throw new Error("Reabre la consulta antes de responder");
      }

      if (!message || message.length > 2000) {
        throw new Error("Escribe una respuesta de hasta 2.000 caracteres");
      }
      if (
        !conversation.handled_by_admin_id &&
        (action === "reply" ||
          action === "reply_chat" ||
          action === "reply_chat_email")
      ) {
        await insertSystemEvent(
          conversationId,
          account,
          `${name} comenzó a atender esta consulta.`,
        );
      }

      const inserted = await insertMessage({
        conversationId,
        sender: "admin",
        senderId: account.id,
        senderName: name,
        adminAccountId: account.id,
        body: message,
        requestId: body.requestId,
        deliveryChannel,
      });

      const update: Record<string, unknown> = {
        ...commonUpdate,
        status: nextStatus,
        unread_admin: 0,
        unread_customer:
          Number(conversation.unread_customer ?? 0) +
          (inserted.duplicate ? 0 : 1),
        last_message_at: now,
      };
      if (action === "request_information") {
        update.evidence_requested_at = now;
        update.evidence_requested_by = account.id;
      }
      if (action === "resolve") {
        update.resolved_at = now;
        update.resolved_by_admin_id = account.id;
        update.resolved_by_admin_name = name;
      }
      const { error: updateError } = await getSupabaseAdmin()
        .from("support_conversations")
        .update(update)
        .eq("id", conversationId);
      if (updateError) throw new Error(updateError.message);

      if (action === "resolve") {
        await insertSystemEvent(
          conversationId,
          account,
          `${name} resolvió la consulta.`,
        );
      }

      if (deliveryChannel === "chat_and_email") {
        const emailResult = await deliverEmailForStoredMessage({
          request,
          messageId: inserted.id,
          conversation,
          message,
          heading,
        });
        if (!emailResult.sent) {
          warning =
            "La respuesta quedó en el chat, pero el correo no pudo enviarse";
        }
      }
    }

    return NextResponse.json({
      ok: true,
      warning,
      conversations: await listConversations(action === "restore"),
    });
  } catch (cause) {
    console.error("No se pudo actualizar la consulta:", cause);
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo actualizar la consulta",
      },
      { status: 400 },
    );
  }
}
