import { createHmac, timingSafeEqual } from "node:crypto";

import {
  ADMIN_PERMISSIONS,
  isAdminRole,
  type AdminPermission,
  type AdminRole,
} from "./permissions";

export {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "./permissions";

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminSessionActor = {
  userId: string | null;
  email: string | null;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  sessionVersion: string | null;
  legacy: boolean;
};

type AdminSessionPayload = AdminSessionActor & { exp: number };

export function getAdminPassword(): string | undefined {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_CONTRASENA ||
    process.env.ADMIN_CONTRASEÑA
  );
}

export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;

  const adminPassword = getAdminPassword()?.trim();
  if (adminPassword) return adminPassword;

  throw new Error("ADMIN_SESSION_SECRET no esta configurado");
}

function signature(value: string): string {
  return createHmac("sha256", getAdminSessionSecret())
    .update(value)
    .digest("base64url");
}

function validSignature(value: string, providedSignature: string) {
  const expected = Buffer.from(signature(value));
  const provided = Buffer.from(providedSignature);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export function createAdminSessionToken(
  actor: Omit<AdminSessionActor, "legacy"> & { legacy?: boolean } = {
    userId: null,
    email: null,
    name: "Administración OLFFY",
    role: "owner",
    permissions: [...ADMIN_PERMISSIONS],
    sessionVersion: null,
  },
): string {
  const payload: AdminSessionPayload = {
    ...actor,
    legacy: actor.legacy ?? actor.userId === null,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function readAdminSessionToken(
  token: string | undefined,
): AdminSessionActor | null {
  if (!token) return null;
  const [encoded, providedSignature] = token.split(".");
  if (
    !encoded ||
    !providedSignature ||
    !validSignature(encoded, providedSignature)
  ) {
    return null;
  }

  if (/^\d+$/.test(encoded)) {
    if (Number(encoded) <= Math.floor(Date.now() / 1000)) return null;
    return {
      userId: null,
      email: null,
      name: "Administración OLFFY",
      role: "owner",
      permissions: [...ADMIN_PERMISSIONS],
      sessionVersion: null,
      legacy: true,
    };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    if (!Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) {
      return null;
    }
    if (!Array.isArray(payload.permissions) || !isAdminRole(payload.role)) {
      return null;
    }
    const permissions = payload.permissions.filter((permission) =>
      ADMIN_PERMISSIONS.includes(permission),
    );
    if (permissions.length === 0) return null;
    return {
      ...payload,
      permissions,
      sessionVersion:
        typeof payload.sessionVersion === "string"
          ? payload.sessionVersion
          : null,
    };
  } catch {
    return null;
  }
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  return Boolean(readAdminSessionToken(token));
}
