import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function getAdminPassword(): string | undefined {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_CONTRASENA ||
    process.env.ADMIN_CONTRASEÑA
  );
}

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || getAdminPassword();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET no esta configurado");
  }

  return secret;
}

function signExpiration(expiresAt: string): string {
  return createHmac("sha256", getAdminSessionSecret())
    .update(expiresAt)
    .digest("base64url");
}

export function createAdminSessionToken(): string {
  const expiresAt = String(
    Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  );

  return `${expiresAt}.${signExpiration(expiresAt)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [expiresAt, providedSignature] = token.split(".");
  const expiresAtNumber = Number(expiresAt);

  if (
    !expiresAt ||
    !providedSignature ||
    !Number.isInteger(expiresAtNumber) ||
    expiresAtNumber <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expectedSignature = signExpiration(expiresAt);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);

  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
