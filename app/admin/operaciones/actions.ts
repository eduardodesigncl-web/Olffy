"use server";

import { requireAdminSession } from "lib/admin/auth";
import { issueOrderBoleta } from "lib/transactions/dte";
import { getOrderReferenceById } from "lib/transactions/repository";
import { revalidatePath } from "next/cache";

export async function retryBoletaAction(formData: FormData) {
  await requireAdminSession();
  const orderRefId = String(formData.get("orderRefId") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(orderRefId)) {
    throw new Error("La operacion seleccionada no es valida");
  }

  const orderRef = await getOrderReferenceById(orderRefId);
  await issueOrderBoleta(orderRef);
  revalidatePath("/admin/operaciones");
}
