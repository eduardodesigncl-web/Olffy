import { getCustomerAccountState } from "lib/customer/auth";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const state = await getCustomerAccountState();
  if (state.status !== "ready") {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin()
    .from("support_conversations")
    .update({ customer_last_seen_at: now, updated_at: now })
    .eq("customer_id", state.customer.id);

  if (error) {
    console.error("No se pudo actualizar la presencia de soporte:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, seenAt: now });
}
