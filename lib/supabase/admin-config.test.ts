import { describe, expect, it } from "vitest";
import { resolveSupabaseAdminConfig } from "./admin-config";

const projectRef = "bocbbpuxnnxxocamerpl";
const url = `https://${projectRef}.supabase.co`;
const newSecretKey = [
  "sb",
  "secret",
  "abcdefghijklmnopqrstuv",
  "12345678",
].join("_");

function serviceRoleJwt(ref = projectRef) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ role: "service_role", ref }),
  ).toString("base64url");
  return `${header}.${payload}.test-signature`;
}

describe("resolveSupabaseAdminConfig", () => {
  it("falls back to a valid service-role key when the new secret is invalid", () => {
    const config = resolveSupabaseAdminConfig({
      NEXT_PUBLIC_SUPABASE_URL: url,
      SUPABASE_SECRET_KEY: "invalid-secret",
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleJwt(),
    });

    expect(config.source).toBe("SUPABASE_SERVICE_ROLE_KEY");
    expect(config.rejectedSources).toEqual(["SUPABASE_SECRET_KEY"]);
  });

  it("prefers a valid new server-side secret key", () => {
    const config = resolveSupabaseAdminConfig({
      NEXT_PUBLIC_SUPABASE_URL: url,
      SUPABASE_SECRET_KEY: newSecretKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleJwt(),
    });

    expect(config.source).toBe("SUPABASE_SECRET_KEY");
    expect(config.rejectedSources).toEqual([]);
  });

  it("rejects a publishable key in a server-only variable", () => {
    expect(() =>
      resolveSupabaseAdminConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        SUPABASE_SECRET_KEY: "sb_publishable_abcdefghijklmnopqrstuv_12345678",
      }),
    ).toThrow(/No valid Supabase admin key/);
  });

  it("rejects a legacy key issued for another project", () => {
    expect(() =>
      resolveSupabaseAdminConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleJwt("anotherprojectref"),
      }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("fails clearly when no admin key exists", () => {
    expect(() =>
      resolveSupabaseAdminConfig({ NEXT_PUBLIC_SUPABASE_URL: url }),
    ).toThrow(/is required for Supabase admin/);
  });
});
