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
      apikey: config.apiKey,
      "x-api-key": config.apiKey,
      "X-TUU-Device-UUID": config.deviceUuid,
      "X-TUU-Device-Serial": config.deviceSerial,
      "X-TUU-Source-Name": config.sourceName,
      "X-TUU-Source-Version": config.sourceVersion,
      ...init?.headers,
    },
    cache: "no-store",
  });
  const responseText = await response.text();
  let body: Record<string, unknown> = {};

  if (responseText) {
    try {
      body = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      body = { raw: responseText };
    }
  }

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
  dteType?: 0 | 33 | 48 | 99;
  extraData?: Record<string, unknown>;
}) {
  const config = getTuuRemotePosConfig();

  return remotePosFetch(config.createPath, {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      IdempotencyKey: input.idempotencyKey,
      Amount: input.amount,
      Device: config.deviceSerial,
      Description: input.description,
      DteType: input.dteType ?? 48,
      extraData: {
        currency: input.currency,
        deviceUuid: config.deviceUuid,
        reference: input.idempotencyKey,
        ...(input.extraData ?? {}),
      },
    }),
  });
}

export async function getTuuRemotePayment(idempotencyKey: string) {
  const config = getTuuRemotePosConfig();

  if (!config.statusPathTemplate) {
    throw new Error(
      "TUU_POS_STATUS_PATH no esta configurado; usa el estado local del webhook.",
    );
  }

  const path = config.statusPathTemplate.replace(
    ":idempotencyKey",
    encodeURIComponent(idempotencyKey),
  );

  return remotePosFetch(path);
}
