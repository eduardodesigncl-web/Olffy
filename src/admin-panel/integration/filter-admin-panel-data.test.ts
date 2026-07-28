import { describe, expect, it } from "vitest";
import type { AdminPanelData } from "./types";
import { filterAdminPanelData } from "./filter-admin-panel-data";

const sample = {
  posReadiness: {
    shopify: true,
    discounts: true,
    tuuRemote: true,
    tuuWebhook: true,
    shopifyWebhooks: true,
  },
  adminData: {
    clientes: [{ email: "private@example.com" }],
    canjesPendientes: [{ id: 1 }],
    historialCliente: [{ movimiento: "Ajuste" }],
    productos: [{ nombre: "Producto" }],
    colecciones: [{ nombre: "Colección" }],
  },
  dashboardMetrics: [{ label: "Ventas" }],
  products: [{ id: 1, name: "Producto" }],
  sales: [{ id: "sale-1" }],
  customerContexts: {
    "1": {
      purchaseCount: 1,
      purchases: [{ id: "sale-1" }],
      supportCount: 1,
      supportConversations: [{ id: "support-1" }],
    },
  },
  loyaltyRule: { id: 1 },
  physicalSalesHistory: [{ id: 1 }],
  pointMovements: [{ id: 1 }],
  rewards: [{ id: 1 }],
  abandonedCheckouts: {
    available: true,
    source: "shopify",
    fetchedAt: "2026-07-17T15:00:00.000Z",
    count: 1,
    totalAmount: 1000,
    checkouts: [{ id: "checkout-1" }],
  },
  storeInfo: {
    name: "OLFFY",
    contactEmail: "hola@olffy.cl",
    phone: "+56 9 1234 5678",
    address: "Viña del Mar, Chile",
    domain: "https://olffy.cl",
    currencyCode: "CLP",
  },
  shopifyAdminUrl: "https://admin.shopify.com/store/olffy",
} as unknown as AdminPanelData;

describe("filterAdminPanelData", () => {
  it("does not serialize unrelated datasets for a dashboard-only account", () => {
    const filtered = filterAdminPanelData(sample, ["dashboard"]);

    expect(filtered.dashboardMetrics).toHaveLength(1);
    expect(filtered.adminData.clientes).toEqual([]);
    expect(filtered.products).toEqual([]);
    expect(filtered.sales).toEqual([]);
    expect(filtered.customerContexts).toEqual({});
    expect(filtered.pointMovements).toEqual([]);
    expect(filtered.rewards).toEqual([]);
    expect(filtered.abandonedCheckouts.checkouts).toEqual([]);
    expect(filtered.storeInfo).toBeNull();
  });

  it("keeps the product and reward data required by POS", () => {
    const filtered = filterAdminPanelData(sample, ["pos"]);

    expect(filtered.products).toHaveLength(1);
    expect(filtered.rewards).toHaveLength(1);
    expect(filtered.loyaltyRule).not.toBeNull();
    expect(filtered.sales).toEqual([]);
    expect(filtered.adminData.clientes).toEqual([]);
    expect(filtered.customerContexts).toEqual({});
  });

  it("removes purchase relations when a customer account cannot see sales", () => {
    const filtered = filterAdminPanelData(sample, ["clientes"]);

    expect(filtered.customerContexts["1"]?.purchaseCount).toBe(0);
    expect(filtered.customerContexts["1"]?.purchases).toEqual([]);
    expect(filtered.customerContexts["1"]?.supportCount).toBe(1);
  });

  it("keeps Shopify store information only for settings accounts", () => {
    expect(filterAdminPanelData(sample, ["ajustes"]).storeInfo?.name).toBe(
      "OLFFY",
    );
    expect(filterAdminPanelData(sample, ["productos"]).storeInfo).toBeNull();
  });

  it("keeps the Shopify order link base for sales accounts", () => {
    expect(filterAdminPanelData(sample, ["ventas"]).shopifyAdminUrl).toBe(
      "https://admin.shopify.com/store/olffy",
    );
  });
});
