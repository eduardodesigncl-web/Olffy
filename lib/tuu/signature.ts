import { createHmac, timingSafeEqual } from "node:crypto";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }

  return value;
}

export function canonicalJson(payload: unknown): string {
  return JSON.stringify(stableValue(payload));
}

export function createTuuSignature(input: {
  payload: unknown;
  secret: string;
  timestamp: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${canonicalJson(input.payload)}`)
    .digest("hex");
}

export function verifyTuuSignature(input: {
  payload: unknown;
  secret: string;
  timestamp: string;
  signature: string;
  toleranceSeconds?: number;
  now?: number;
}): boolean {
  const parsedTimestamp = Number(input.timestamp);
  const timestampMs =
    parsedTimestamp > 10_000_000_000 ? parsedTimestamp : parsedTimestamp * 1000;
  const now = input.now ?? Date.now();
  const toleranceMs = (input.toleranceSeconds ?? 300) * 1000;

  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(now - timestampMs) > toleranceMs
  ) {
    return false;
  }

  const expected = Buffer.from(
    createTuuSignature({
      payload: input.payload,
      secret: input.secret,
      timestamp: input.timestamp,
    }),
    "utf8",
  );
  const provided = Buffer.from(input.signature.trim().toLowerCase(), "utf8");

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
