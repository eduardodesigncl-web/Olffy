"use server";

import { requireAdminSession } from "lib/admin/auth";
import {
  adjustCustomerPoints,
  calculatePointsForAmount,
  createLoyaltyCustomer,
  createReward,
  getActiveLoyaltyRule,
  redeemReward,
  registerPhysicalSale,
  reversePointsTransaction,
} from "lib/loyalty/service";
import {
  approveRewardRedemption,
  cancelShopifyRewardRedemption,
  syncShopifyRewardRedemptionUsage,
} from "lib/loyalty/redemptions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function requiredString(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Falta ${key}`);
  }

  return value;
}

function requiredNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));

  if (!Number.isFinite(value)) {
    throw new Error(`${key} no es valido`);
  }

  return value;
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Ocurrio un error inesperado";
}

export async function createCustomerAction(formData: FormData) {
  await requireAdminSession();
  let customerId: number;

  try {
    const customer = await createLoyaltyCustomer({
      email: requiredString(formData, "email"),
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });
    customerId = customer.id;
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  redirect(`/admin/puntos/clientes/${customerId}?created=1`);
}

export async function adjustPointsAction(formData: FormData) {
  await requireAdminSession();
  const customerId = requiredNumber(formData, "customerId");

  try {
    await adjustCustomerPoints({
      customerId,
      points: requiredNumber(formData, "points"),
      reason: requiredString(formData, "reason"),
      createdBy: requiredString(formData, "createdBy"),
      externalReference: String(formData.get("externalReference") ?? ""),
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes/${customerId}?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath(`/admin/puntos/clientes/${customerId}`);
  redirect(`/admin/puntos/clientes/${customerId}?adjusted=1`);
}

export async function reverseTransactionAction(formData: FormData) {
  await requireAdminSession();
  const customerId = requiredNumber(formData, "customerId");

  try {
    await reversePointsTransaction({
      transactionId: requiredNumber(formData, "transactionId"),
      reason: requiredString(formData, "reason"),
      createdBy: requiredString(formData, "createdBy"),
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes/${customerId}?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath(`/admin/puntos/clientes/${customerId}`);
  redirect(`/admin/puntos/clientes/${customerId}?reversed=1`);
}

export async function redeemRewardAction(formData: FormData) {
  await requireAdminSession();
  const customerId = requiredNumber(formData, "customerId");

  try {
    await redeemReward({
      customerId,
      rewardId: requiredNumber(formData, "rewardId"),
      createdBy: requiredString(formData, "createdBy"),
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes/${customerId}?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath(`/admin/puntos/clientes/${customerId}`);
  redirect(`/admin/puntos/clientes/${customerId}?redeemed=1`);
}

export async function updateRedemptionStatusAction(formData: FormData) {
  await requireAdminSession();
  const customerId = requiredNumber(formData, "customerId");

  try {
    const redemptionId = requiredNumber(formData, "redemptionId");
    const status = requiredString(formData, "status");
    const createdBy = requiredString(formData, "createdBy");

    if (status === "approved") {
      await approveRewardRedemption({
        redemptionId,
        createdBy,
      });
    } else if (status === "fulfilled") {
      await syncShopifyRewardRedemptionUsage({
        redemptionId,
        createdBy,
      });
    } else {
      throw new Error("Estado de canje no soportado");
    }
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes/${customerId}?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath(`/admin/puntos/clientes/${customerId}`);
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/canjes");
  redirect(`/admin/puntos/clientes/${customerId}?redemptionUpdated=1`);
}

export async function cancelRedemptionAction(formData: FormData) {
  await requireAdminSession();
  const customerId = requiredNumber(formData, "customerId");

  try {
    await cancelShopifyRewardRedemption({
      redemptionId: requiredNumber(formData, "redemptionId"),
      reason: requiredString(formData, "reason"),
      createdBy: requiredString(formData, "createdBy"),
      expired: String(formData.get("expired") ?? "") === "1",
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/clientes/${customerId}?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath(`/admin/puntos/clientes/${customerId}`);
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/canjes");
  redirect(`/admin/puntos/clientes/${customerId}?redemptionCancelled=1`);
}

export async function createRewardAction(formData: FormData) {
  await requireAdminSession();

  try {
    await createReward({
      name: requiredString(formData, "name"),
      description: String(formData.get("description") ?? ""),
      rewardType: "discount",
      pointsCost: requiredNumber(formData, "pointsCost"),
      discountAmountClp: requiredNumber(formData, "discountAmountClp"),
      minimumPurchaseClp: Number(formData.get("minimumPurchaseClp") ?? 0),
      validityDays: Number(formData.get("validityDays") ?? 30),
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/recompensas?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath("/admin/puntos/recompensas");
  redirect("/admin/puntos/recompensas?created=1");
}

export async function registerPhysicalSaleAction(formData: FormData) {
  await requireAdminSession();

  try {
    const total = requiredNumber(formData, "total");
    const discount = Number(formData.get("discount") ?? 0);
    const rawCustomerId = String(formData.get("customerId") ?? "").trim();
    const customerId = rawCustomerId ? Number(rawCustomerId) : undefined;
    const rule = await getActiveLoyaltyRule();
    const pointsEarned = customerId ? calculatePointsForAmount(total, rule) : 0;

    await registerPhysicalSale({
      customerId,
      tuuTransactionId: requiredString(formData, "tuuTransactionId"),
      receiptNumber: String(formData.get("receiptNumber") ?? ""),
      subtotal: total + discount,
      discount,
      total,
      pointsEarned,
      items: [],
      notes: String(formData.get("notes") ?? ""),
      createdBy: requiredString(formData, "createdBy"),
    });
  } catch (cause) {
    redirect(
      `/admin/puntos/ventas?error=${encodeURIComponent(errorMessage(cause))}`,
    );
  }

  revalidatePath("/admin/puntos");
  revalidatePath("/admin/puntos/ventas");
  redirect("/admin/puntos/ventas?created=1");
}
