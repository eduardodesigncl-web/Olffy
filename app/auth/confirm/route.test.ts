import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock(
  "lib/customer/return-url",
  async () => await import("../../../lib/customer/return-url"),
);
vi.mock(
  "lib/customer/recovery",
  async () => await import("../../../lib/customer/recovery"),
);
vi.mock("lib/customer/auth", () => ({
  completeVerifiedCustomerAccount: vi.fn(),
}));
vi.mock("lib/supabase/config", () => ({
  hasSupabasePublicConfig: vi.fn(),
}));
vi.mock("lib/supabase/server", () => ({
  getSupabaseServer: vi.fn(),
}));

import { completeVerifiedCustomerAccount } from "lib/customer/auth";
import { hasSupabasePublicConfig } from "lib/supabase/config";
import { getSupabaseServer } from "lib/supabase/server";
import { GET } from "./route";

function supabaseWith(input?: {
  verifyError?: Error | null;
  exchangeError?: Error | null;
}) {
  return {
    auth: {
      verifyOtp: vi
        .fn()
        .mockResolvedValue({ error: input?.verifyError ?? null }),
      exchangeCodeForSession: vi
        .fn()
        .mockResolvedValue({ error: input?.exchangeError ?? null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "customer-auth-user" } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("CUSTOMER_AUTH_SITE_URL", "https://olffy.cl");
  vi.mocked(hasSupabasePublicConfig).mockReturnValue(true);
  vi.mocked(completeVerifiedCustomerAccount).mockResolvedValue({
    id: 42,
  } as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("customer auth confirmation callback", () => {
  it("verifica token_hash, crea recuperación y neutraliza next externo", async () => {
    const supabase = supabaseWith();
    vi.mocked(getSupabaseServer).mockResolvedValue(supabase as never);

    const response = await GET(
      new Request(
        "https://preview.vercel.app/auth/confirm?token_hash=hash&type=recovery&next=https://evil.example",
      ),
    );

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "hash",
      type: "recovery",
    });
    expect(response.headers.get("location")).toBe("https://olffy.cl/cuenta");
    expect(response.headers.get("set-cookie")).toContain(
      "olffy_password_recovery=authorized",
    );
  });

  it("intercambia code PKCE y redirige a la pantalla real", async () => {
    const supabase = supabaseWith();
    vi.mocked(getSupabaseServer).mockResolvedValue(supabase as never);

    const response = await GET(
      new Request(
        "https://olffy.cl/auth/confirm?code=auth-code&next=/cuenta/restablecer",
      ),
    );

    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "auth-code",
    );
    expect(response.headers.get("location")).toBe(
      "https://olffy.cl/cuenta/restablecer",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "olffy_password_recovery=authorized",
    );
  });

  it("rechaza un enlace expirado sin crear cookie de recuperación", async () => {
    const supabase = supabaseWith({
      verifyError: new Error("Token has expired"),
    });
    vi.mocked(getSupabaseServer).mockResolvedValue(supabase as never);

    const response = await GET(
      new Request(
        "https://preview.vercel.app/auth/confirm?token_hash=expired&type=recovery&next=/cuenta/restablecer",
      ),
    );

    expect(response.headers.get("location")).toMatch(
      /^https:\/\/olffy\.cl\/cuenta\/login\?error=/,
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
