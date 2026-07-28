import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminApiUnauthorizedResponse: vi.fn(),
  claimPhysicalSalePosAttempt: vi.fn(),
  failPhysicalSalePosAttempt: vi.fn(),
  finalizePreparedPhysicalSale: vi.fn(),
  preparePhysicalSale: vi.fn(),
}));

vi.mock("lib/admin/api-auth", () => ({
  getAdminApiUnauthorizedResponse: mocks.getAdminApiUnauthorizedResponse,
}));

vi.mock("lib/loyalty/service", () => ({
  claimPhysicalSalePosAttempt: mocks.claimPhysicalSalePosAttempt,
  failPhysicalSalePosAttempt: mocks.failPhysicalSalePosAttempt,
}));

vi.mock("lib/loyalty/physical-pos", () => ({
  finalizePreparedPhysicalSale: mocks.finalizePreparedPhysicalSale,
  physicalSaleErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : "Error desconocido",
  preparePhysicalSale: mocks.preparePhysicalSale,
  requiredPhysicalSaleText: (value: unknown, label: string) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) throw new Error(`Falta ${label}`);
    return normalized;
  },
}));

vi.mock("lib/shopify/admin", () => ({
  checkAdminOrderAccess: vi.fn(),
}));

import { POST } from "./route";

const prepared = {
  fingerprint: "fingerprint-venta",
  subtotal: 12_000,
  discount: 2_000,
  total: 10_000,
  pointsEarned: 50,
  pointsSpent: 10,
};

function manualSaleRequest(overrides: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/admin/loyalty/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentConfirmed: true,
      paymentReference: " MANUAL-001 ",
      receiptNumber: "B-100",
      responsible: "Camila",
      notes: "Pago verificado en caja",
      items: [{ variantId: "gid://shopify/ProductVariant/1", quantity: 1 }],
      ...overrides,
    }),
  });
}

describe("POST /api/admin/loyalty/sales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminApiUnauthorizedResponse.mockResolvedValue(null);
    mocks.preparePhysicalSale.mockResolvedValue({ ...prepared });
    mocks.claimPhysicalSalePosAttempt.mockResolvedValue({
      attemptId: "attempt-1",
      claimToken: "claim-1",
      status: "pending",
    });
    mocks.finalizePreparedPhysicalSale.mockResolvedValue({
      physicalSaleId: 42,
      shopifyOrderId: "gid://shopify/Order/42",
      shopifyOrderName: "#1042",
      alreadyCompleted: false,
    });
  });

  it("finaliza un cobro manual confirmado con el flujo físico existente", async () => {
    const response = await POST(manualSaleRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.claimPhysicalSalePosAttempt).toHaveBeenCalledWith({
      tuuTransactionId: "MANUAL-001",
      payloadFingerprint: prepared.fingerprint,
      createdBy: "Camila",
    });
    expect(mocks.finalizePreparedPhysicalSale).toHaveBeenCalledWith({
      prepared,
      attempt: {
        attemptId: "attempt-1",
        claimToken: "claim-1",
      },
      paymentReference: "MANUAL-001",
      receiptNumber: "B-100",
      responsible: "Camila",
      notes: "Pago verificado en caja",
      saleChannelDetail: "physical_tuu_manual",
    });
    expect(body).toMatchObject({
      success: true,
      alreadyCompleted: false,
      status: "completed",
      paymentReference: "MANUAL-001",
      folio: "#42",
      shopifyOrderName: "#1042",
      pointsEarned: 50,
      pointsSpent: 10,
    });
  });

  it("informa un reintento ya completado sin volver a finalizar la venta", async () => {
    mocks.claimPhysicalSalePosAttempt.mockResolvedValue({
      attemptId: "attempt-1",
      status: "completed",
      physicalSaleId: 42,
      shopifyOrderId: "gid://shopify/Order/42",
      shopifyOrderName: "#1042",
    });

    const response = await POST(manualSaleRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      alreadyCompleted: true,
      status: "completed",
      paymentReference: "MANUAL-001",
      folio: "#42",
    });
    expect(mocks.finalizePreparedPhysicalSale).not.toHaveBeenCalled();
  });

  it("exige confirmación real del pago", async () => {
    const response = await POST(manualSaleRequest({ paymentConfirmed: false }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Debes confirmar que el pago fue recibido",
    });
    expect(mocks.preparePhysicalSale).not.toHaveBeenCalled();
    expect(mocks.claimPhysicalSalePosAttempt).not.toHaveBeenCalled();
  });

  it("mantiene el mensaje QA-24 para un carrito vacío", async () => {
    mocks.preparePhysicalSale.mockRejectedValue(
      new Error("Agrega al menos un producto al carrito"),
    );

    const response = await POST(manualSaleRequest({ items: [] }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Agrega al menos un producto al carrito",
    });
  });
});
