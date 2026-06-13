"use server";

import { requireCustomerAccount } from "lib/customer/auth";
import { createLoyaltyCustomer } from "lib/loyalty/service";
import { requestCustomerReward } from "lib/customer/redemptions";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getSupabaseServer } from "lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function message(cause: unknown) {
  if (!(cause instanceof Error)) {
    return "Ocurrió un error inesperado.";
  }

  const normalized = cause.message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials")
  ) {
    return "El correo o la contraseña no son correctos.";
  }

  if (normalized.includes("password")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  return cause.message;
}

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error("Completa todos los campos requeridos.");
  }

  return value;
}

export async function requestMagicLinkAction(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const password = requiredString(formData, "password");

  try {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  } catch (cause) {
    if (
      cause &&
      typeof cause === "object" &&
      "digest" in cause &&
      String(cause.digest).startsWith("NEXT_REDIRECT")
    ) {
      throw cause;
    }

    redirect(`/cuenta/login?error=${encodeURIComponent(message(cause))}`);
  }

  redirect("/cuenta");
}

export async function registerCustomerAction(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const fullName = requiredString(formData, "fullName");
  const phone = requiredString(formData, "phone");
  const password = requiredString(formData, "password");
  const passwordConfirmation = requiredString(formData, "passwordConfirmation");
  let createdCustomerId: number | null = null;
  let createdAuthUserId: string | null = null;

  try {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }

    if (password !== passwordConfirmation) {
      throw new Error("Las contraseñas no coinciden.");
    }

    const admin = getSupabaseAdmin();
    const { data: existingCustomer, error: customerError } = await admin
      .from("loyalty_customers")
      .select("id, auth_user_id")
      .ilike("email", email)
      .maybeSingle();

    if (customerError) {
      throw customerError;
    }

    if (existingCustomer?.auth_user_id) {
      redirect(
        `/cuenta/login?mode=login&error=${encodeURIComponent("Este correo ya tiene una cuenta. Ingresa con tu contraseña.")}`,
      );
    }

    const { data: usersData, error: usersError } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      throw usersError;
    }

    const existingAuthUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    const { data: authData, error: authError } = existingAuthUser
      ? await admin.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            phone,
          },
        })
      : await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            phone,
          },
        });

    if (authError || !authData.user) {
      throw authError ?? new Error("No se pudo crear el acceso.");
    }

    if (!existingAuthUser) {
      createdAuthUserId = authData.user.id;
    }

    if (existingCustomer) {
      const { error: updateError } = await admin
        .from("loyalty_customers")
        .update({
          auth_user_id: authData.user.id,
          full_name: fullName,
          phone,
        })
        .eq("id", existingCustomer.id)
        .is("auth_user_id", null);

      if (updateError) {
        throw updateError;
      }
    } else {
      const customer = await createLoyaltyCustomer({
        email,
        fullName,
        phone,
        metadata: {
          registration_source: "customer_account",
        },
      });
      createdCustomerId = customer.id;

      const { error: linkError } = await admin
        .from("loyalty_customers")
        .update({ auth_user_id: authData.user.id })
        .eq("id", customer.id)
        .is("auth_user_id", null);

      if (linkError) {
        throw linkError;
      }
    }

    const supabase = await getSupabaseServer();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw signInError;
    }
  } catch (cause) {
    if (
      cause &&
      typeof cause === "object" &&
      "digest" in cause &&
      String(cause.digest).startsWith("NEXT_REDIRECT")
    ) {
      throw cause;
    }

    if (createdAuthUserId) {
      await getSupabaseAdmin().auth.admin.deleteUser(createdAuthUserId);
    }

    if (createdCustomerId) {
      await getSupabaseAdmin()
        .from("loyalty_customers")
        .delete()
        .eq("id", createdCustomerId)
        .is("auth_user_id", null);
    }

    redirect(
      `/cuenta/login?mode=register&error=${encodeURIComponent(message(cause))}`,
    );
  }

  redirect("/cuenta");
}

export async function signOutCustomerAction() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  redirect("/cuenta/login?signedOut=1");
}

export async function requestRewardAction(formData: FormData) {
  const { customer, user } = await requireCustomerAccount();

  try {
    const rewardId = Number(requiredString(formData, "rewardId"));
    const requestId = requiredString(formData, "requestId");

    if (!Number.isSafeInteger(rewardId) || rewardId <= 0) {
      throw new Error("La recompensa seleccionada no es valida.");
    }

    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      throw new Error("La solicitud de canje no es valida.");
    }

    await requestCustomerReward({
      customer,
      userId: user.id,
      rewardId,
      requestId,
    });
  } catch (cause) {
    redirect(`/cuenta/recompensas?error=${encodeURIComponent(message(cause))}`);
  }

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/historial");
  revalidatePath("/cuenta/recompensas");
  revalidatePath("/cuenta/canjes");
  redirect("/cuenta/canjes?requested=1");
}
