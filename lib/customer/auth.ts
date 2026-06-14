import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { hasSupabasePublicConfig } from "lib/supabase/config";
import { getSupabaseServer } from "lib/supabase/server";
import { redirect } from "next/navigation";

export type CustomerAccount = {
  id: number;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: "active" | "blocked";
  points_balance: number;
  lifetime_points_earned: number;
  lifetime_points_redeemed: number;
  created_at: string;
};

export type CustomerAccountState =
  | { status: "ready"; user: User; customer: CustomerAccount }
  | { status: "signed_out" }
  | { status: "not_enrolled"; user: User };

const customerFields =
  "id, auth_user_id, email, full_name, phone, status, points_balance, lifetime_points_earned, lifetime_points_redeemed, created_at";

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function isEnrolledCustomer(email: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .select("id")
    .ilike("email", normalizedEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar la inscripcion: ${error.message}`);
  }

  return Boolean(data);
}

function registrationProfile(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;

  return {
    source:
      typeof metadata.registration_source === "string"
        ? metadata.registration_source
        : null,
    fullName:
      typeof metadata.full_name === "string"
        ? metadata.full_name.trim() || null
        : null,
    phone:
      typeof metadata.phone === "string" ? metadata.phone.trim() || null : null,
  };
}

export async function completeVerifiedCustomerAccount(
  user: User,
): Promise<CustomerAccount | null> {
  if (!user.email || !user.email_confirmed_at) {
    return null;
  }

  const admin = getSupabaseAdmin();
  const { data: existing, error: findError } = await admin
    .from("loyalty_customers")
    .select(customerFields)
    .ilike("email", normalizedEmail(user.email))
    .maybeSingle();

  if (findError) {
    throw new Error(`No se pudo vincular la cuenta: ${findError.message}`);
  }

  if (existing?.auth_user_id && existing.auth_user_id !== user.id) {
    throw new Error("Esta cuenta de puntos ya esta vinculada a otro acceso.");
  }

  if (existing?.auth_user_id === user.id) {
    return existing as CustomerAccount;
  }

  const profile = registrationProfile(user);

  if (existing) {
    const { data: linked, error: updateError } = await admin
      .from("loyalty_customers")
      .update({
        auth_user_id: user.id,
        full_name: existing.full_name ?? profile.fullName,
        phone: existing.phone ?? profile.phone,
      })
      .eq("id", existing.id)
      .is("auth_user_id", null)
      .select(customerFields)
      .maybeSingle();

    if (updateError) {
      throw new Error(`No se pudo vincular la cuenta: ${updateError.message}`);
    }

    if (linked) {
      return linked as CustomerAccount;
    }

    const { data: concurrent, error: concurrentError } = await admin
      .from("loyalty_customers")
      .select(customerFields)
      .eq("id", existing.id)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (concurrentError) {
      throw new Error(
        `No se pudo confirmar la cuenta: ${concurrentError.message}`,
      );
    }

    return (concurrent as CustomerAccount | null) ?? null;
  }

  if (profile.source !== "customer_account") {
    return null;
  }

  const { data: created, error: createError } = await admin
    .from("loyalty_customers")
    .insert({
      auth_user_id: user.id,
      email: normalizedEmail(user.email),
      full_name: profile.fullName,
      phone: profile.phone,
      metadata: {
        registration_source: profile.source,
      },
    })
    .select(customerFields)
    .single();

  if (!createError) {
    return created as CustomerAccount;
  }

  if (createError.code !== "23505") {
    throw new Error(`No se pudo crear la cuenta: ${createError.message}`);
  }

  const { data: concurrent, error: concurrentError } = await admin
    .from("loyalty_customers")
    .select(customerFields)
    .ilike("email", normalizedEmail(user.email))
    .maybeSingle();

  if (concurrentError) {
    throw new Error(
      `No se pudo confirmar la cuenta: ${concurrentError.message}`,
    );
  }

  if (concurrent?.auth_user_id === user.id) {
    return concurrent as CustomerAccount;
  }

  throw new Error("No se pudo vincular la cuenta de fidelizacion.");
}

export async function getCustomerAccountState(): Promise<CustomerAccountState> {
  if (!hasSupabasePublicConfig()) {
    return { status: "signed_out" };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "signed_out" };
  }

  const { data: customer, error } = await supabase
    .from("loyalty_customers")
    .select(customerFields)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la cuenta: ${error.message}`);
  }

  if (!customer) {
    return { status: "not_enrolled", user };
  }

  return {
    status: "ready",
    user,
    customer: customer as CustomerAccount,
  };
}

export async function requireCustomerAccount() {
  const state = await getCustomerAccountState();

  if (state.status === "signed_out") {
    redirect("/cuenta/login");
  }

  if (state.status === "not_enrolled") {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
    redirect("/cuenta/login?error=no-inscrita");
  }

  return state;
}
