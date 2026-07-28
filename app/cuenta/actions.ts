"use server";

import {
  completeVerifiedCustomerAccount,
  requireCustomerAccount,
} from "lib/customer/auth";
import {
  validateCustomerEmail,
  validateCustomerName,
  validateCustomerPassword,
} from "lib/customer/auth-input";
import {
  buildCustomerConfirmationRedirect,
  buildCustomerRecoveryRedirect,
  CUSTOMER_RECOVERY_COOKIE,
  CUSTOMER_RECOVERY_COOKIE_VALUE,
  resolveCustomerAuthOrigin,
} from "lib/customer/recovery";
import { requestCustomerReward } from "lib/customer/redemptions";
import { getSupabaseServer } from "lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type CustomerAuthActionResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: string;
      code?: "email_not_confirmed" | "rate_limited" | "invalid_input";
    };

type LoginInput = { email: string; password: string };
type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};
type EmailInput = { email: string };
type PasswordUpdateInput = {
  password: string;
  passwordConfirmation: string;
};

const GENERIC_EMAIL_MESSAGE =
  "Si el correo corresponde a una cuenta válida, recibirás un mensaje en los próximos minutos.";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error("Completa todos los campos requeridos.");
  }

  return value;
}

function normalizedError(cause: unknown) {
  if (!cause || typeof cause !== "object") return "";

  const error = cause as { code?: string; message?: string };
  return `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
}

function authFailure(cause: unknown): CustomerAuthActionResult {
  const normalized = normalizedError(cause);

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return {
      ok: false,
      code: "rate_limited",
      error: "Espera unos minutos antes de intentarlo nuevamente.",
    };
  }

  if (
    normalized.includes("email_not_confirmed") ||
    normalized.includes("email not confirmed")
  ) {
    return {
      ok: false,
      code: "email_not_confirmed",
      error: "Debes confirmar tu correo antes de iniciar sesión.",
    };
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials")
  ) {
    return {
      ok: false,
      error: "El correo o la contraseña no son correctos.",
    };
  }

  if (normalized.includes("email address not authorized")) {
    return {
      ok: false,
      error:
        "El servicio de correo todavía no permite enviar a esta dirección. Contacta a OLFFY.",
    };
  }

  return {
    ok: false,
    error: "No pudimos completar la solicitud. Intenta nuevamente.",
  };
}

function invalidInput(cause: unknown): CustomerAuthActionResult {
  return {
    ok: false,
    code: "invalid_input",
    error:
      cause instanceof Error
        ? cause.message
        : "Revisa los datos ingresados e intenta nuevamente.",
  };
}

async function getCustomerAuthOrigin() {
  const requestHeaders = await headers();
  return resolveCustomerAuthOrigin({
    nodeEnv: process.env.NODE_ENV,
    customerAuthSiteUrl: process.env.CUSTOMER_AUTH_SITE_URL,
    requestOrigin: requestHeaders.get("origin"),
    forwardedHost:
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    forwardedProtocol: requestHeaders.get("x-forwarded-proto"),
  });
}

export async function loginCustomerAction(
  input: LoginInput,
): Promise<CustomerAuthActionResult> {
  let email: string;

  try {
    email = validateCustomerEmail(input.email);
    if (!input.password) throw new Error("Ingresa tu contraseña.");
  } catch (cause) {
    return invalidInput(cause);
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) return authFailure(error);

  try {
    const customer = data.user
      ? await completeVerifiedCustomerAccount(data.user)
      : null;

    if (!customer) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        error:
          "No pudimos vincular tu cuenta de cliente. Contacta a OLFFY para recibir ayuda.",
      };
    }
  } catch (cause) {
    console.error("No se pudo vincular la cuenta durante el login.", cause);
    await supabase.auth.signOut({ scope: "local" });
    return {
      ok: false,
      error:
        "No pudimos vincular tu cuenta de cliente. Contacta a OLFFY para recibir ayuda.",
    };
  }

  return { ok: true };
}

export async function registerCustomerAction(
  input: RegisterInput,
): Promise<CustomerAuthActionResult> {
  let email: string;
  let fullName: string;

  try {
    email = validateCustomerEmail(input.email);
    fullName = validateCustomerName(input.fullName);
    validateCustomerPassword(input.password, input.passwordConfirmation);
  } catch (cause) {
    return invalidInput(cause);
  }

  try {
    const supabase = await getSupabaseServer();
    const origin = await getCustomerAuthOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: buildCustomerConfirmationRedirect(origin),
        data: {
          full_name: fullName,
          registration_source: "customer_account",
        },
      },
    });

    if (error) return authFailure(error);

    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        error:
          "La verificación de correo no está activa. Contacta a OLFFY antes de continuar.",
      };
    }

    return { ok: true, message: GENERIC_EMAIL_MESSAGE };
  } catch (cause) {
    console.error("No se pudo registrar la cuenta de cliente.", cause);
    return authFailure(cause);
  }
}

export async function resendCustomerConfirmationAction(
  input: EmailInput,
): Promise<CustomerAuthActionResult> {
  let email: string;

  try {
    email = validateCustomerEmail(input.email);
  } catch (cause) {
    return invalidInput(cause);
  }

  try {
    const supabase = await getSupabaseServer();
    const origin = await getCustomerAuthOrigin();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildCustomerConfirmationRedirect(origin),
      },
    });

    if (error) return authFailure(error);
    return { ok: true, message: GENERIC_EMAIL_MESSAGE };
  } catch (cause) {
    console.error("No se pudo reenviar la confirmación.", cause);
    return authFailure(cause);
  }
}

export async function requestCustomerPasswordRecoveryAction(
  input: EmailInput,
): Promise<CustomerAuthActionResult> {
  let email: string;

  try {
    email = validateCustomerEmail(input.email);
  } catch (cause) {
    return invalidInput(cause);
  }

  try {
    const supabase = await getSupabaseServer();
    const origin = await getCustomerAuthOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildCustomerRecoveryRedirect(origin),
    });

    if (error) return authFailure(error);
    return { ok: true, message: GENERIC_EMAIL_MESSAGE };
  } catch (cause) {
    console.error("No se pudo solicitar la recuperación de contraseña.", cause);
    return authFailure(cause);
  }
}

export async function updateCustomerPasswordAction(
  input: PasswordUpdateInput,
): Promise<CustomerAuthActionResult> {
  try {
    validateCustomerPassword(input.password, input.passwordConfirmation);
  } catch (cause) {
    return invalidInput(cause);
  }

  const cookieStore = await cookies();
  if (
    cookieStore.get(CUSTOMER_RECOVERY_COOKIE)?.value !==
    CUSTOMER_RECOVERY_COOKIE_VALUE
  ) {
    return {
      ok: false,
      error: "El enlace de recuperación expiró. Solicita uno nuevo.",
    };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    cookieStore.delete(CUSTOMER_RECOVERY_COOKIE);
    return {
      ok: false,
      error: "La sesión de recuperación expiró. Solicita un enlace nuevo.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) return authFailure(error);

  await supabase.auth.signOut({ scope: "global" });
  cookieStore.delete(CUSTOMER_RECOVERY_COOKIE);
  return { ok: true };
}

export async function signOutCustomerAction() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut({ scope: "local" });
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
    const error =
      cause instanceof Error ? cause.message : "Ocurrió un error inesperado.";
    redirect(`/cuenta/recompensas?error=${encodeURIComponent(error)}`);
  }

  revalidatePath("/cuenta");
  revalidatePath("/cuenta/historial");
  revalidatePath("/cuenta/recompensas");
  revalidatePath("/cuenta/canjes");
  redirect("/cuenta/canjes?issued=1");
}
