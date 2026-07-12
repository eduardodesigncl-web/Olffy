import { getAdminApiUnauthorizedResponse } from "lib/admin/api-auth";
import { upsertAdminCustomer } from "lib/shopify/admin";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

function message(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo crear el cliente";
}

export async function POST(request: Request) {
  const unauthorized = await getAdminApiUnauthorizedResponse();
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
    };
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (fullName.length < 2) throw new Error("Ingresa el nombre del cliente");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Ingresa un email válido");
    }

    const shopifyCustomer = await upsertAdminCustomer({
      fullName,
      email,
    });
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase
      .from("loyalty_customers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);

    const write = existing
      ? supabase
          .from("loyalty_customers")
          .update({
            full_name: fullName,
            shopify_customer_id: shopifyCustomer.id,
          })
          .eq("id", existing.id)
      : supabase.from("loyalty_customers").insert({
          email,
          full_name: fullName,
          shopify_customer_id: shopifyCustomer.id,
          status: "active",
          metadata: { registration_source: "admin" },
        });
    const { data, error } = await write
      .select("id,email,full_name,status,points_balance,created_at")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/admin");
    return NextResponse.json({ success: true, customer: data });
  } catch (error) {
    console.error("Error creating admin customer:", error);
    return NextResponse.json({ error: message(error) }, { status: 400 });
  }
}
