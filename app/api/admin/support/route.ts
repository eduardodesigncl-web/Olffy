import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getAdminSessionActor } from "lib/admin/auth";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { sendSupportEmail } from "lib/support/email";
import { mapSupportConversation, mapSupportMessage } from "lib/support/mappers";
import type { SupportMessage } from "lib/support/types";
import { NextResponse } from "next/server";

const CONVERSATION_FIELDS =
  "id,customer_id,customer_email,customer_name,status,unread_admin,unread_customer,last_message_at,created_at,updated_at";
const MESSAGE_FIELDS =
  "id,conversation_id,sender,body,delivery_channel,email_status,created_at";

async function listConversations() {
  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("support_conversations")
    .select(CONVERSATION_FIELDS)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const ids = (rows ?? []).map((row) => row.id);
  let messages: SupportMessage[] = [];

  if (ids.length > 0) {
    const { data: messageRows, error: messagesError } = await supabase
      .from("support_messages")
      .select(MESSAGE_FIELDS)
      .in("conversation_id", ids)
      .order("created_at", { ascending: true })
      .limit(1000);

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

export async function GET() {
  const unauthorized = await getAdminApiUnauthorizedResponse("clientes");
  if (unauthorized) return unauthorized;

  try {
    const conversations = await listConversations();
    return NextResponse.json({
      conversations,
      unread: conversations.reduce(
        (total, conversation) => total + conversation.unreadAdmin,
        0,
      ),
    });
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
      .update({ unread_admin: 0, updated_at: new Date().toISOString() })
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
      conversationId?: string;
      message?: string;
      sendEmail?: boolean;
    };
    const conversationId = String(body.conversationId ?? "");
    const message = String(body.message ?? "").trim();

    if (!conversationId || !message || message.length > 2000) {
      throw new Error("Escribe una respuesta de hasta 2.000 caracteres");
    }

    const supabase = getSupabaseAdmin();
    const actor = await getAdminSessionActor();
    const { data: adminAccount } = actor?.userId
      ? await supabase
          .from("admin_accounts")
          .select("id")
          .eq("auth_user_id", actor.userId)
          .maybeSingle()
      : { data: null };
    const { data: conversation, error: findError } = await supabase
      .from("support_conversations")
      .select(CONVERSATION_FIELDS)
      .eq("id", conversationId)
      .single();

    if (findError) throw new Error(findError.message);

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender: "admin",
        body: message,
        admin_account_id: adminAccount?.id ?? null,
        delivery_channel: body.sendEmail ? "chat_email" : "chat",
        email_status: body.sendEmail ? "pending" : "not_requested",
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);

    const { error: updateError } = await supabase
      .from("support_conversations")
      .update({
        status: "answered",
        unread_admin: 0,
        unread_customer: Number(conversation.unread_customer ?? 0) + 1,
        last_message_at: now,
        updated_at: now,
      })
      .eq("id", conversationId);

    if (updateError) throw new Error(updateError.message);

    if (body.sendEmail) {
      const emailResult = await sendSupportEmail({
        to: conversation.customer_email,
        subject: "OLFFY respondió tu consulta",
        heading: "Tenemos una respuesta para ti",
        body: `${message}\n\nTambién puedes revisar esta respuesta entrando a Mi cuenta en OLFFY.`,
      });

      await supabase
        .from("support_messages")
        .update({
          email_status: emailResult.sent ? "sent" : "failed",
          email_error: emailResult.sent
            ? null
            : emailResult.error.slice(0, 1000),
        })
        .eq("id", inserted.id);

      if (!emailResult.sent) {
        return NextResponse.json(
          {
            error: `La respuesta quedó guardada en el chat, pero el correo no se envió: ${emailResult.error}`,
            conversations: await listConversations(),
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      conversations: await listConversations(),
    });
  } catch (cause) {
    console.error("No se pudo responder la consulta:", cause);
    return NextResponse.json(
      {
        error: cause instanceof Error ? cause.message : "No se pudo responder",
      },
      { status: 400 },
    );
  }
}
