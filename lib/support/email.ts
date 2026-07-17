import "server-only";

type SupportEmailInput = {
  to: string;
  subject: string;
  heading: string;
  body: string;
  replyTo?: string;
};

export type SupportEmailResult =
  | { sent: true }
  | { sent: false; error: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendSupportEmail(
  input: SupportEmailInput,
): Promise<SupportEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.SUPPORT_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return {
      sent: false,
      error: "Falta configurar RESEND_API_KEY y SUPPORT_EMAIL_FROM.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: `${input.heading}\n\n${input.body}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#2f2119;line-height:1.6;max-width:620px">
            <div style="font-weight:800;color:#ee4b00;font-size:22px;margin-bottom:18px">OLFFY®</div>
            <h1 style="font-size:20px;margin:0 0 14px">${escapeHtml(input.heading)}</h1>
            <div style="background:#fff6dc;border-radius:18px;padding:18px;white-space:pre-wrap">${escapeHtml(input.body)}</div>
          </div>
        `,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.text();
      return {
        sent: false,
        error: `Resend ${response.status}: ${payload.slice(0, 500)}`,
      };
    }

    return { sent: true };
  } catch (cause) {
    return {
      sent: false,
      error:
        cause instanceof Error ? cause.message : "No se pudo enviar el correo.",
    };
  }
}
