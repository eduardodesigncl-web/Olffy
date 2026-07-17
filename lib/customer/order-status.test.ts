import { describe, expect, it } from "vitest";
import {
  resolveCustomerOrderStatus,
  type ShopifyOrderStatusSnapshot,
} from "./order-status";

function snapshot(
  overrides: Partial<ShopifyOrderStatusSnapshot> = {},
): ShopifyOrderStatusSnapshot {
  return {
    cancelledAt: null,
    displayFinancialStatus: "PAID",
    displayFulfillmentStatus: "UNFULFILLED",
    shippingLineTitle: "Tienda Olffy",
    fulfillments: [],
    fulfillmentOrders: [],
    events: [],
    ...overrides,
  };
}

describe("resolveCustomerOrderStatus", () => {
  it("mapea el evento real de Shopify como listo para retiro", () => {
    const result = resolveCustomerOrderStatus(
      "preparacion",
      snapshot({
        events: [
          {
            message: "Gabriela sent a ready for pickup email to the customer.",
          },
        ],
      }),
    );

    expect(result).toEqual({ estado: "listo_retiro", entrega: "retiro" });
  });

  it("reconoce Tienda Olffy como retiro antes de estar listo", () => {
    expect(resolveCustomerOrderStatus("preparacion", snapshot())).toEqual({
      estado: "preparacion",
      entrega: "retiro",
    });
  });

  it("prioriza retirado sobre el evento histórico de listo para retiro", () => {
    const result = resolveCustomerOrderStatus(
      "preparacion",
      snapshot({
        events: [
          { message: "A ready for pickup email was sent." },
          { message: "The order was marked as picked up." },
        ],
      }),
    );

    expect(result.estado).toBe("entregado");
  });

  it("mantiene el flujo de despacho para un método de envío", () => {
    const result = resolveCustomerOrderStatus(
      "preparacion",
      snapshot({
        shippingLineTitle: "Envío estándar",
        displayFulfillmentStatus: "FULFILLED",
      }),
    );

    expect(result).toEqual({ estado: "enviado", entrega: "envio" });
  });

  it("usa el fulfillment order cuando el scope está concedido", () => {
    const result = resolveCustomerOrderStatus(
      "preparacion",
      snapshot({
        shippingLineTitle: null,
        fulfillmentOrders: [
          {
            status: "IN_PROGRESS",
            requestStatus: "UNSUBMITTED",
            methodType: "PICK_UP",
          },
        ],
      }),
    );

    expect(result).toEqual({ estado: "listo_retiro", entrega: "retiro" });
  });
});
