import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { getSupabaseAdmin } from "lib/supabase/admin";
import {
  enqueueConsentedCustomerProfileSync,
  getMarketingQueueSummary,
  processMarketingOutbox,
} from "lib/transactions/marketing";
import { NextResponse } from "next/server";

function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo sincronizar Klaviyo";
}

export async function POST() {
  const unauthorized = await getAdminApiUnauthorizedResponse("ajustes");
  if (unauthorized) return unauthorized;

  try {
    if (process.env.MARKETING_PROVIDER?.trim().toLowerCase() !== "klaviyo") {
      throw new Error("MARKETING_PROVIDER debe estar configurado como klaviyo");
    }

    const supabase = getSupabaseAdmin();
    const { error: providerError } = await supabase
      .from("marketing_event_outbox")
      .update({ provider: "klaviyo" })
      .in("status", ["pending", "failed"])
      .eq("provider", "noop");
    if (providerError) throw new Error(providerError.message);

    const contactsQueued = await enqueueConsentedCustomerProfileSync();
    const delivery = await processMarketingOutbox(100);
    const queue = await getMarketingQueueSummary();

    return NextResponse.json({
      success: delivery.failed === 0,
      contactsQueued,
      delivery,
      queue,
    });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}
