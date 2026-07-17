"use server";

// Acciones del panel de cliente (/cuenta) del frontend oficial: canje de
// recompensas, actualización de perfil y cambio de contraseña con sesión
// activa. Devuelven resultados JSON (sin redirects) para que la UI nueva
// muestre el feedback en su propio estilo.
import { requireCustomerAccount } from "lib/customer/auth";
import {
  validateCustomerName,
  validateCustomerPassword,
} from "lib/customer/auth-input";
import { requestCustomerReward } from "lib/customer/redemptions";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getSupabaseServer } from "lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AccountActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function failure(cause: unknown, fallback: string): AccountActionResult {
  return {
    ok: false,
    error: cause instanceof Error ? cause.message : fallback,
  };
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function redeemCustomerRewardAction(input: {
  rewardId: number;
  requestId: string;
}): Promise<AccountActionResult> {
  const { customer, user } = await requireCustomerAccount();

  try {
    if (!Number.isSafeInteger(input.rewardId) || input.rewardId <= 0) {
      throw new Error("La recompensa seleccionada no es válida.");
    }
    if (!UUID_RE.test(input.requestId)) {
      throw new Error("La solicitud de canje no es válida.");
    }

    await requestCustomerReward({
      customer,
      userId: user.id,
      rewardId: input.rewardId,
      requestId: input.requestId,
    });
  } catch (cause) {
    return failure(cause, "No se pudo solicitar el canje.");
  }

  revalidatePath("/cuenta");
  return {
    ok: true,
    message: "Canje solicitado. Revisa el código en la pestaña Canjes.",
  };
}

export async function updateCustomerProfileAction(input: {
  fullName: string;
  phone: string;
}): Promise<AccountActionResult> {
  const { customer } = await requireCustomerAccount();

  let fullName: string;
  try {
    fullName = validateCustomerName(input.fullName);
  } catch (cause) {
    return failure(cause, "Revisa los datos ingresados.");
  }

  const phone = input.phone.trim().slice(0, 30) || null;

  const { error } = await getSupabaseAdmin()
    .from("loyalty_customers")
    .update({ full_name: fullName, phone })
    .eq("id", customer.id);

  if (error) {
    console.error("No se pudo actualizar el perfil del cliente:", error);
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }

  revalidatePath("/cuenta");
  return { ok: true, message: "Datos actualizados." };
}

export async function changeCustomerPasswordAction(input: {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}): Promise<AccountActionResult> {
  const { customer } = await requireCustomerAccount();

  try {
    if (!input.currentPassword) {
      throw new Error("Ingresa tu contraseña actual.");
    }
    validateCustomerPassword(input.password, input.passwordConfirmation);
  } catch (cause) {
    return failure(cause, "Revisa los datos ingresados.");
  }

  const supabase = await getSupabaseServer();

  // Reautenticación explícita antes de cambiar la clave.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: customer.email,
    password: input.currentPassword,
  });

  if (verifyError) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    console.error("No se pudo actualizar la contraseña:", error);
    return {
      ok: false,
      error: "No se pudo actualizar la contraseña. Intenta nuevamente.",
    };
  }

  return { ok: true, message: "Contraseña actualizada correctamente." };
}
