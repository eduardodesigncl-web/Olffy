type AdminAction =
  | "adjustCustomerPoints"
  | "registerTuuSale"
  | "approveRedemption"
  | "rejectRedemption"
  | "retryBoleta";

async function callAdminAction<T>(
  action: AdminAction,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/adapters/admin-actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ action, payload }),
  });
  const result = (await response.json()) as {
    success?: boolean;
    error?: string;
  } & T;

  if (!response.ok || result.success === false) {
    throw new Error(result.error || "No se pudo completar la acción admin");
  }

  return result;
}

export async function adjustCustomerPoints(
  customerId: string,
  amount: number,
  reason: string,
  createdBy = "OLFFY Admin",
  comprobante?: string,
) {
  return callAdminAction("adjustCustomerPoints", {
    customerId,
    amount,
    reason,
    createdBy,
    comprobante,
  });
}

export async function registerTuuSale(data: {
  customerEmail?: string;
  amount: number;
  operator: string;
  tuuTransactionId?: string;
  receiptNumber?: string;
  notes?: string;
}) {
  return callAdminAction("registerTuuSale", data);
}

export async function approveRedemption(
  redemptionId: string,
  approvedBy = "OLFFY Admin",
) {
  return callAdminAction("approveRedemption", {
    redemptionId,
    approvedBy,
  });
}

export async function rejectRedemption(
  redemptionId: string,
  reason: string,
  createdBy = "OLFFY Admin",
) {
  return callAdminAction("rejectRedemption", {
    redemptionId,
    reason,
    createdBy,
  });
}

export async function retryBoleta(saleId: string) {
  return callAdminAction("retryBoleta", { saleId });
}
