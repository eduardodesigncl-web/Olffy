import "server-only";

export type DteIssueInput = {
  idempotencyKey: string;
  olffyReference: string;
  shopifyOrderId: string;
  shopifyOrderName?: string;
  total: number;
  currency: "CLP";
  customerEmail?: string;
};

export type DteIssueResult = {
  status: "issued" | "accepted" | "rejected" | "manual_review";
  provider: string;
  folio?: string;
  issuedAt?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  responseUrl?: string;
  error?: string;
  raw?: Record<string, unknown>;
};

export interface DteProvider {
  readonly name: string;
  issueBoleta(input: DteIssueInput): Promise<DteIssueResult>;
}

export async function getDteProvider(): Promise<DteProvider> {
  const provider = process.env.DTE_PROVIDER?.trim().toLowerCase() || "noop";

  if (provider === "noop") {
    const { noopDteProvider } = await import("./providers/noop");
    return noopDteProvider;
  }

  if (provider === "openfactura") {
    const { openFacturaDteProvider } = await import("./providers/openfactura");
    return openFacturaDteProvider;
  }

  throw new Error(`Proveedor DTE no soportado: ${provider}`);
}
