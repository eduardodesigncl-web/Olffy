import { describe, expect, it } from "vitest";
import { buildCustomerContexts } from "./customer-context";
import type { AdminPanelCustomer, UnifiedSale } from "./types";

const customer: AdminPanelCustomer = {
  idx: 42,
  nombre: "Ana OLFFY",
  email: "ana@example.com",
  tel: "",
  puntos: 120,
  estado: "Activo",
  createdAt: "2026-07-01T00:00:00.000Z",
};

function sale(id: string, overrides: Partial<UnifiedSale> = {}): UnifiedSale {
  return {
    id,
    folio: `#${id}`,
    cliente: "Ana OLFFY",
    email: "ana@example.com",
    customerId: 42,
    fechaISO: "2026-07-27T10:00:00.000Z",
    fecha: "27/07/2026",
    total: "$12.000",
    totalN: 12_000,
    metodoPago: "Shopify Payments",
    estadoPago: "Pagado",
    origen: "online",
    origenLabel: "Online",
    referenciaPago: id,
    boleta: "Emitida",
    puntos: 12,
    loyaltyStatus: "processed",
    shopifyOrderId: `gid://shopify/Order/${id}`,
    detalleCanal: "online_shopify",
    montoElegible: "$12.000",
    montoExcluido: "$0",
    reglaAplicada: "Regla base",
    ...overrides,
  };
}

describe("buildCustomerContexts", () => {
  it("relates sales and support without duplicating either collection", () => {
    const contexts = buildCustomerContexts(
      [customer],
      [sale("1"), sale("2", { customerId: null, email: "ANA@example.com" })],
      [
        {
          id: "support-1",
          reference: "#SUP-1",
          status: "in_progress",
          statusLabel: "En atención",
          lastMessage: "Necesito ayuda",
          lastMessageAt: "2026-07-28T10:00:00.000Z",
          lastMessageDate: "28/07/2026",
          archived: false,
          customerId: 42,
          customerEmail: "ana@example.com",
        },
      ],
    );

    expect(contexts["42"]?.purchaseCount).toBe(2);
    expect(contexts["42"]?.purchases.map((item) => item.id)).toEqual([
      "1",
      "2",
    ]);
    expect(contexts["42"]?.supportCount).toBe(1);
    expect(contexts["42"]?.supportConversations[0]?.id).toBe("support-1");
  });

  it("returns explanatory empty collections for customers without activity", () => {
    const contexts = buildCustomerContexts([customer], [], []);

    expect(contexts["42"]).toEqual({
      purchaseCount: 0,
      purchases: [],
      supportCount: 0,
      supportConversations: [],
    });
  });
});
