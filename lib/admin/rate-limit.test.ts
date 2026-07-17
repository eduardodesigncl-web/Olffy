import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));

import { adminLoginKeyHash } from "./rate-limit";

const previousSecret = process.env.ADMIN_SESSION_SECRET;

afterEach(() => {
  if (previousSecret === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
});

describe("adminLoginKeyHash", () => {
  it("normalizes the account identifier", () => {
    process.env.ADMIN_SESSION_SECRET = "test-admin-secret";

    expect(adminLoginKeyHash("127.0.0.1", " Owner@Olffy.cl ")).toBe(
      adminLoginKeyHash("127.0.0.1", "owner@olffy.cl"),
    );
  });

  it("isolates accounts that sign in from the same IP", () => {
    process.env.ADMIN_SESSION_SECRET = "test-admin-secret";

    expect(adminLoginKeyHash("127.0.0.1", "owner@olffy.cl")).not.toBe(
      adminLoginKeyHash("127.0.0.1", "cashier@olffy.cl"),
    );
  });
});
