import "server-only";

import { getTuuRemotePosConfig } from "./config";

async function remotePosFetch(
  path: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const config = getTuuRemotePosConfig();
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-TUU-Device-Serial": config.deviceSerial,
      "X-TUU-Source-Name": config.sourceName,
      "X-TUU-Source-Version": config.sourceVersion,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `TUU POS respondio ${response.status}: ${String(body.message ?? body.error ?? "error desconocido")}`,
    );
  }

  return body;
}

export async function createTuuRemotePayment(input: {
  idempotencyKey: string;
  amount: number;
  currency: "CLP";
  description: string;
}) {
  return remotePosFetch("/remote-payments", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      reference: input.idempotencyKey,
    }),
  });
}

export async function getTuuRemotePayment(idempotencyKey: string) {
  return remotePosFetch(
    `/remote-payments/${encodeURIComponent(idempotencyKey)}`,
  );
}
