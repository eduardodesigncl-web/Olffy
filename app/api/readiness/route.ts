import { getSupabaseAdmin } from "lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin()
      .from("loyalty_customers")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: "ready",
      dependencies: { supabase: "ok" },
    });
  } catch (cause) {
    console.warn(
      "Supabase readiness check failed",
      cause instanceof Error ? cause.name : "UnknownError",
    );
    return NextResponse.json(
      { status: "not_ready", dependencies: { supabase: "error" } },
      { status: 503 },
    );
  }
}
