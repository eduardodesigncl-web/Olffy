import type { DteProvider } from "../provider";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} no esta configurado`);
  return value;
}

export const openFacturaDteProvider: DteProvider = {
  name: "openfactura",
  async issueBoleta(input) {
    const apiUrl = required("DTE_API_URL").replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/boletas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${required("DTE_API_KEY")}`,
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        rut_emisor: required("DTE_RUT_EMISOR"),
        ambiente: process.env.DTE_AMBIENTE?.trim() || "certificacion",
        tipo_documento: "boleta_afecta",
        referencia: input.olffyReference,
        orden_shopify: input.shopifyOrderName ?? input.shopifyOrderId,
        total: input.total,
        moneda: input.currency,
        email_receptor: input.customerEmail,
      }),
      cache: "no-store",
    });
    const body = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return {
        status: response.status >= 500 ? "manual_review" : "rejected",
        provider: "openfactura",
        error: String(body.message ?? body.error ?? `HTTP ${response.status}`),
        raw: body,
      };
    }

    return {
      status:
        String(body.sii_status ?? "").toLowerCase() === "accepted"
          ? "accepted"
          : "issued",
      provider: "openfactura",
      folio: body.folio ? String(body.folio) : undefined,
      issuedAt: String(body.issued_at ?? new Date().toISOString()),
      pdfUrl: body.pdf_url ? String(body.pdf_url) : undefined,
      xmlUrl: body.xml_url ? String(body.xml_url) : undefined,
      responseUrl: body.response_url ? String(body.response_url) : undefined,
      raw: body,
    };
  },
};
