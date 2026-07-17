import { afterEach, describe, expect, it } from "vitest";
import { createAdminSessionToken, readAdminSessionToken } from "./session";

const previousSecret = process.env.ADMIN_SESSION_SECRET;

afterEach(() => {
  process.env.ADMIN_SESSION_SECRET = previousSecret;
});

describe("admin session tokens", () => {
  it("preserves the account version used to invalidate old sessions", () => {
    process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
    const token = createAdminSessionToken({
      userId: "f06f64c7-b335-4bcd-9090-e0edce80f277",
      email: "manager@example.com",
      name: "Manager QA",
      role: "manager",
      permissions: ["dashboard", "ventas"],
      sessionVersion: "2026-07-17T15:00:00.000Z",
    });

    expect(readAdminSessionToken(token)).toMatchObject({
      userId: "f06f64c7-b335-4bcd-9090-e0edce80f277",
      role: "manager",
      permissions: ["dashboard", "ventas"],
      sessionVersion: "2026-07-17T15:00:00.000Z",
      legacy: false,
    });
  });

  it("rejects a modified token", () => {
    process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
    const token = createAdminSessionToken();
    expect(readAdminSessionToken(`${token}changed`)).toBeNull();
  });
});
