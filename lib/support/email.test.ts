import { afterEach, describe, expect, it, vi } from "vitest";

const { createTransportMock, sendMailMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(),
  sendMailMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

import { sendSupportEmail } from "./email";

function configureSmtp() {
  vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
  vi.stubEnv("SMTP_PORT", "465");
  vi.stubEnv("SMTP_SECURE", "true");
  vi.stubEnv("SMTP_USER", "admin@example.com");
  vi.stubEnv("SMTP_PASSWORD", "app-password-test");
  vi.stubEnv("SUPPORT_EMAIL_FROM", "OLFFY <admin@example.com>");
  vi.stubEnv("SUPPORT_EMAIL_TO", "respuestas@example.com");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("support email SMTP", () => {
  it("envía por TLS, conserva referencia estable y devuelve messageId", async () => {
    configureSmtp();
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });
    sendMailMock.mockResolvedValue({
      messageId: "<support-admin-message-77@olffy.cl>",
    });

    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-77",
    });

    expect(result).toEqual({
      sent: true,
      providerId: "<support-admin-message-77@olffy.cl>",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "admin@example.com",
          pass: "app-password-test",
        },
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "OLFFY <admin@example.com>",
        to: "cliente@example.com",
        replyTo: "respuestas@example.com",
        messageId: "<support-admin-message-77@olffy.cl>",
        headers: {
          "X-OLFFY-Idempotency-Key": "support-admin-message-77",
        },
      }),
    );
  });

  it("registra un fallo SMTP sanitizado sin exponer la contraseña", async () => {
    configureSmtp();
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });
    sendMailMock.mockRejectedValue(
      Object.assign(new Error("Authentication failed for app-password-test"), {
        code: "EAUTH",
        responseCode: 535,
      }),
    );

    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-78",
    });

    expect(result).toEqual({
      sent: false,
      error: "EAUTH: Authentication failed for [oculto]",
    });
    expect(JSON.stringify(result)).not.toContain("app-password-test");
  });

  it("falla de forma explícita si falta configuración SMTP", async () => {
    const result = await sendSupportEmail({
      to: "cliente@example.com",
      subject: "Respuesta",
      heading: "OLFFY respondió",
      body: "Mensaje",
      idempotencyKey: "support-admin-message-79",
    });

    expect(result).toEqual({
      sent: false,
      error:
        "Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SUPPORT_EMAIL_FROM y SUPPORT_EMAIL_TO.",
    });
    expect(createTransportMock).not.toHaveBeenCalled();
  });
});
