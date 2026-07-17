import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendSupportEmail } from "./email";

const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.SUPPORT_EMAIL_FROM;

afterEach(() => {
  process.env.RESEND_API_KEY = originalKey;
  process.env.SUPPORT_EMAIL_FROM = originalFrom;
  vi.unstubAllGlobals();
});

describe("support email", () => {
  it("usa una clave idempotente y devuelve el id de Resend", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SUPPORT_EMAIL_FROM = "OLFFY <soporte@olffy.cl>";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-77",
    });

    expect(result).toEqual({ sent: true, providerId: "email_123" });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      "support-admin-message-77",
    );
  });

  it("informa el fallo sin lanzar y permite conservar el mensaje", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SUPPORT_EMAIL_FROM = "OLFFY <soporte@olffy.cl>";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("provider unavailable", { status: 503 }),
        ),
    );
    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-78",
    });
    expect(result.sent).toBe(false);
  });
});
