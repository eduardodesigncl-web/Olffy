import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendSupportEmail } from "./email";

const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.SUPPORT_EMAIL_FROM;
const originalTo = process.env.SUPPORT_EMAIL_TO;

afterEach(() => {
  process.env.RESEND_API_KEY = originalKey;
  process.env.SUPPORT_EMAIL_FROM = originalFrom;
  process.env.SUPPORT_EMAIL_TO = originalTo;
  vi.unstubAllGlobals();
});

describe("support email", () => {
  it("usa una clave idempotente y devuelve el id de Resend", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SUPPORT_EMAIL_FROM = "OLFFY <soporte@olffy.cl>";
    process.env.SUPPORT_EMAIL_TO = "respuestas@olffy.cl";
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
    expect(JSON.parse(String(init.body))).toMatchObject({
      reply_to: "respuestas@olffy.cl",
    });
  });

  it("informa el fallo sin lanzar y permite conservar el mensaje", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SUPPORT_EMAIL_FROM = "OLFFY <soporte@olffy.cl>";
    process.env.SUPPORT_EMAIL_TO = "respuestas@olffy.cl";
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

  it("sanitiza errores del proveedor sin exponer claves ni payload completo", async () => {
    process.env.RESEND_API_KEY = "re_live_secret";
    process.env.SUPPORT_EMAIL_FROM = "OLFFY <soporte@olffy.cl>";
    process.env.SUPPORT_EMAIL_TO = "respuestas@olffy.cl";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Authorization Bearer secret.token re_live_secret",
            raw: "detalle que no debe propagarse",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-79",
    });

    expect(result).toEqual({
      sent: false,
      error: "Resend 401: Authorization Bearer [oculto] re_[oculto]",
    });
    expect(JSON.stringify(result)).not.toContain("detalle que no debe");
  });
});
