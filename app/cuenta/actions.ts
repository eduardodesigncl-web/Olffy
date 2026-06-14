"use server";

import { requireCustomerAccount } from "lib/customer/auth";
import { requestCustomerReward } from "lib/customer/redemptions";
import { getSupabaseServer } from "lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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

function isExistingAccountError(cause: unknown) {
  const normalized = cause instanceof Error ? cause.message.toLowerCase() : "";

  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already")
  );
}

function registrationErrorMessage(cause: unknown) {
  const normalized = cause instanceof Error ? cause.message.toLowerCase() : "";

  if (normalized.includes("al menos 8 caracteres")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (normalized.includes("no coinciden")) {
    return "Las contraseñas no coinciden.";
  }

  if (isExistingAccountError(cause)) {
    return "Este correo ya tiene una cuenta. Ingresa o recupera tu contraseña.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Espera unos minutos antes de intentar registrarte nuevamente.";
  }

  if (normalized.includes("invalid email")) {
    return "Ingresa un correo electrónico válido.";
  }

  return "No pudimos completar el registro. Intenta nuevamente.";
}

async function getSiteOrigin() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (configuredUrl) {
    const url = configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`;

    return new URL(url).origin;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!host) {
    throw new Error("No se pudo determinar la URL del sitio.");
  }

  return `${protocol}://${host}`;
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

  try {
    if (password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }

    if (password !== passwordConfirmation) {
      throw new Error("Las contraseñas no coinciden.");
    }

    const supabase = await getSupabaseServer();
    const origin = await getSiteOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/cuenta`,
        data: {
          full_name: fullName,
          phone,
          registration_source: "customer_account",
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      await supabase.auth.signOut();
      redirect(
        `/cuenta/login?mode=register&error=${encodeURIComponent(
          "El registro requiere verificación por correo. Contacta a OLFFY si el problema continúa.",
        )}`,
      );
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

    const mode = isExistingAccountError(cause) ? "login" : "register";
    redirect(
      `/cuenta/login?mode=${mode}&error=${encodeURIComponent(
        registrationErrorMessage(cause),
      )}`,
    );
  }

  redirect("/cuenta/login?mode=login&verification=sent");
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
