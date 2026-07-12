"use server";

import { getSupabaseAdmin } from "lib/supabase/admin";
import { processMarketingOutbox } from "lib/transactions/marketing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function marketingProviderName() {
  return process.env.MARKETING_PROVIDER?.trim().toLowerCase() || "noop";
}

// Suscribe un email al newsletter: encola un evento en marketing_event_outbox
// que el cron /api/cron/marketing/process-events envía a Klaviyo (suscripción
// a la lista + evento "OLFFY - Newsletter Signup").
export async function subscribeNewsletterAction(email: string) {
  const normalized = email?.trim().toLowerCase();

  if (!normalized || !EMAIL_RE.test(normalized)) {
    return { success: false, error: "Email inválido" };
  }

  const supabase = getSupabaseAdmin();
  const idempotencyKey = `marketing:newsletter:${normalized}`;
  const { error } = await supabase.from("marketing_event_outbox").upsert(
    {
      event_type: "Newsletter Signup",
      idempotency_key: idempotencyKey,
      email: normalized,
      payload_minimal: { source: "storefront_footer" },
      provider: marketingProviderName(),
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );

  if (error) {
    console.error("No se pudo encolar la suscripción al newsletter", error);
    return { success: false, error: "No se pudo procesar la suscripción" };
  }

  if (marketingProviderName() === "klaviyo") {
    await processMarketingOutbox(10);
  }

  const { data: queued } = await supabase
    .from("marketing_event_outbox")
    .select("status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  return {
    success: true,
    pending: queued?.status !== "processed",
  };
}

// Guarda un mensaje del formulario de contacto en Supabase
// (tabla contact_messages, solo accesible con service role).
export async function submitContactAction(input: {
  name: string;
  email: string;
  message: string;
}) {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const message = input.message?.trim();

  if (!name || !message || !email || !EMAIL_RE.test(email)) {
    return { success: false, error: "Completa todos los campos" };
  }

  const { error } = await getSupabaseAdmin()
    .from("contact_messages")
    .insert({
      name: name.slice(0, 200),
      email,
      message: message.slice(0, 5000),
    });

  if (error) {
    console.error("No se pudo guardar el mensaje de contacto", error);
    return { success: false, error: "No se pudo enviar el mensaje" };
  }

  return { success: true };
}
