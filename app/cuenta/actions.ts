"use server";

import { isEnrolledCustomer, requireCustomerAccount } from "lib/customer/auth";
import { createLoyaltyCustomer } from "lib/loyalty/service";
import { requestCustomerReward } from "lib/customer/redemptions";
import { getSupabaseServer } from "lib/supabase/server";
import { baseUrl } from "lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function message(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "Ocurrio un error inesperado.";
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

  try {
    if (!(await isEnrolledCustomer(email))) {
      redirect("/cuenta/login?error=no-inscrita");
    }

    await sendCustomerAccessLink(email);
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

  redirect(`/cuenta/login?sent=${encodeURIComponent(email)}`);
}

export async function registerCustomerAction(formData: FormData) {
  const email = requiredString(formData, "email").toLowerCase();
  const fullName = requiredString(formData, "fullName");
  const phone = requiredString(formData, "phone");

  try {
    if (await isEnrolledCustomer(email)) {
      redirect(
        `/cuenta/login?mode=login&error=${encodeURIComponent("Este correo ya tiene una cuenta. Ingresa para continuar.")}`,
      );
    }

    await createLoyaltyCustomer({
      email,
      fullName,
      phone,
      metadata: {
        registration_source: "customer_account",
      },
    });
    await sendCustomerAccessLink(email);
  } catch (cause) {
    if (
      cause &&
      typeof cause === "object" &&
      "digest" in cause &&
      String(cause.digest).startsWith("NEXT_REDIRECT")
    ) {
      throw cause;
    }

    redirect(
      `/cuenta/login?mode=register&error=${encodeURIComponent(message(cause))}`,
    );
  }

  redirect(
    `/cuenta/login?mode=register&created=1&sent=${encodeURIComponent(email)}`,
  );
}

async function sendCustomerAccessLink(email: string) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm?next=/cuenta`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw error;
  }
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
