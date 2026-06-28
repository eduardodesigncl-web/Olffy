import "server-only";

import { getDteProvider } from "lib/dte/provider";
import { updateOlffyOrderMetafields } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { updateOrderReference, upsertOrderReference } from "./repository";

type OrderRef = Awaited<ReturnType<typeof upsertOrderReference>>;

export async function issueOrderBoleta(orderRef: OrderRef) {
  const supabase = getSupabaseAdmin();
  const idempotencyKey = `dte:${orderRef.shopify_order_id}`;
  const { data: existing, error: findError } = await supabase
    .from("tax_document_refs")
    .select("*")
    .eq("shopify_order_id", orderRef.shopify_order_id!)
    .maybeSingle();

  if (findError) {
    throw new Error(`No se pudo consultar la boleta: ${findError.message}`);
  }

  if (existing && ["issued", "accepted"].includes(existing.sii_status)) {
    await updateOrderReference(orderRef.id, {
      tax_status: existing.sii_status,
    });
    await updateOlffyOrderMetafields(orderRef.shopify_order_id!, [
      {
        namespace: "olffy",
        key: "boleta_folio",
        value: existing.folio ?? "pending",
      },
      {
        namespace: "olffy",
        key: "sii_status",
        value: existing.sii_status,
      },
    ]);
    return existing;
  }

  const provider = await getDteProvider();
  const { data: taxRef, error: reserveError } = await supabase
    .from("tax_document_refs")
    .upsert(
      {
        order_ref_id: orderRef.id,
        shopify_order_id: orderRef.shopify_order_id,
        shopify_order_name: orderRef.shopify_order_name,
        olffy_reference: orderRef.olffy_reference,
        provider: provider.name,
        idempotency_key: idempotencyKey,
        total: orderRef.total,
        currency: orderRef.currency,
        sii_status: "pending",
      },
      { onConflict: "shopify_order_id" },
    )
    .select("*")
    .single();

  if (reserveError) {
    throw new Error(`No se pudo reservar la boleta: ${reserveError.message}`);
  }

  let result;

  try {
    result = await provider.issueBoleta({
      idempotencyKey,
      olffyReference: orderRef.olffy_reference,
      shopifyOrderId: orderRef.shopify_order_id!,
      shopifyOrderName: orderRef.shopify_order_name ?? undefined,
      total: orderRef.total,
      currency: orderRef.currency,
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Error desconocido del DTE";
    await supabase
      .from("tax_document_refs")
      .update({
        sii_status: "manual_review",
        error_message: message.slice(0, 2000),
        retry_count: Number(taxRef.retry_count ?? 0) + 1,
      })
      .eq("id", taxRef.id);
    await updateOrderReference(orderRef.id, {
      tax_status: "manual_review",
      last_error: message,
    });
    throw cause;
  }
  const { data, error } = await supabase
    .from("tax_document_refs")
    .update({
      provider: result.provider,
      folio: result.folio ?? null,
      sii_status: result.status,
      issued_at: result.issuedAt ?? null,
      pdf_url: result.pdfUrl ?? null,
      xml_url: result.xmlUrl ?? null,
      response_url: result.responseUrl ?? null,
      error_message: result.error ?? null,
      provider_response: result.raw ?? {},
      retry_count: Number(taxRef.retry_count ?? 0) + 1,
    })
    .eq("id", taxRef.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`No se pudo guardar la boleta: ${error.message}`);
  }

  await updateOrderReference(orderRef.id, {
    tax_status: result.status,
    last_error: result.error ?? null,
  });
  await updateOlffyOrderMetafields(orderRef.shopify_order_id!, [
    {
      namespace: "olffy",
      key: "boleta_folio",
      value: result.folio ?? "pending",
    },
    {
      namespace: "olffy",
      key: "sii_status",
      value: result.status,
    },
  ]);

  return data;
}
