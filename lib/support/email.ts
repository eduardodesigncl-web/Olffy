import "server-only";

import nodemailer from "nodemailer";
import { sanitizeSupportEmailError } from "./workflow";

type SupportEmailInput = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  replyTo?: string;
  actionUrl?: string;
  actionLabel?: string;
  idempotencyKey: string;
};

export type SupportEmailResult =
  | { sent: true; providerId: string | null }
  | { sent: false; error: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const secure = process.env.SMTP_SECURE?.trim().toLowerCase() !== "false";
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.SUPPORT_EMAIL_FROM?.trim();
  const replyTo = process.env.SUPPORT_EMAIL_TO?.trim();

  if (
    !host ||
    !Number.isSafeInteger(port) ||
    port <= 0 ||
    port > 65_535 ||
    !user ||
    !password ||
    !from ||
    !replyTo
  ) {
    return null;
  }

  return { host, port, secure, user, password, from, replyTo };
}

export async function sendSupportEmail(
  input: SupportEmailInput,
): Promise<SupportEmailResult> {
  const smtp = smtpConfiguration();

  if (!smtp) {
    return {
      sent: false,
      error:
        "Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SUPPORT_EMAIL_FROM y SUPPORT_EMAIL_TO.",
    };
  }

  const replyTo = input.replyTo?.trim() || smtp.replyTo;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      requireTLS: !smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    const info = await transporter.sendMail({
      from: smtp.from,
      to: input.to,
      replyTo,
      subject: input.subject,
      text: `${input.heading}\n\n${input.body}${
        input.actionUrl
          ? `\n\n${input.actionLabel || "Abrir conversación"}: ${input.actionUrl}`
          : ""
      }`,
      html: `
          <div style="font-family:Arial,sans-serif;color:#2f2119;line-height:1.6;max-width:620px">
            <div style="font-weight:800;color:#ee4b00;font-size:22px;margin-bottom:18px">OLFFY®</div>
            <h1 style="font-size:20px;margin:0 0 14px">${escapeHtml(input.heading)}</h1>
            <div style="background:#fff6dc;border-radius:18px;padding:18px;white-space:pre-wrap">${escapeHtml(input.body)}</div>
            ${
              input.actionUrl
                ? `<a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;margin-top:18px;padding:12px 20px;border-radius:999px;background:#5d58bd;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(input.actionLabel || "Abrir conversación")}</a>`
                : ""
            }
          </div>
        `,
      messageId: `<${input.idempotencyKey}@olffy.cl>`,
      headers: {
        "X-OLFFY-Idempotency-Key": input.idempotencyKey,
      },
    });

    return {
      sent: true,
      providerId:
        typeof info.messageId === "string" && info.messageId
          ? info.messageId
          : null,
    };
  } catch (cause) {
    const details =
      cause && typeof cause === "object"
        ? (cause as {
            code?: unknown;
            responseCode?: unknown;
            message?: unknown;
          })
        : null;
    const message =
      typeof details?.message === "string"
        ? details.message
        : "No se pudo enviar el correo mediante SMTP.";
    const safeMessage = message.replaceAll(smtp.password, "[oculto]");
    const code =
      typeof details?.code === "string" ? `${details.code}: ` : "SMTP: ";

    return {
      sent: false,
      error: sanitizeSupportEmailError(`${code}${safeMessage}`),
    };
  }
}
