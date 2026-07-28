import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildCustomerRecoveryRedirect,
  resolveCustomerAuthOrigin,
} from "./recovery";

describe("customer recovery origin", () => {
  it("ignora un request preview y usa el dominio canónico en producción", () => {
    const origin = resolveCustomerAuthOrigin({
      nodeEnv: "production",
      customerAuthSiteUrl: "https://olffy.cl",
      requestOrigin: "https://olffy-git-feature.vercel.app",
    });

    expect(buildCustomerRecoveryRedirect(origin)).toBe(
      "https://olffy.cl/auth/confirm?next=/cuenta/restablecer",
    );
  });

  it("mantiene el dominio oficial cuando el request ya es canónico", () => {
    expect(
      resolveCustomerAuthOrigin({
        nodeEnv: "production",
        customerAuthSiteUrl: "https://olffy.cl",
        requestOrigin: "https://olffy.cl",
      }),
    ).toBe("https://olffy.cl");
  });

  it("permite localhost en desarrollo", () => {
    expect(
      resolveCustomerAuthOrigin({
        nodeEnv: "development",
        customerAuthSiteUrl: "https://olffy.cl",
        requestOrigin: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000");
  });

  it("rechaza configuración insegura o ausente en producción", () => {
    expect(() =>
      resolveCustomerAuthOrigin({
        nodeEnv: "production",
        customerAuthSiteUrl: "http://olffy.cl",
        requestOrigin: "https://olffy.cl",
      }),
    ).toThrow();
    expect(() =>
      resolveCustomerAuthOrigin({
        nodeEnv: "production",
        customerAuthSiteUrl: undefined,
        requestOrigin: "https://olffy.cl",
      }),
    ).toThrow();
  });
});
