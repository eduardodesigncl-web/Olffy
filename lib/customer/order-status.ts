export type CustomerOrderStatus =
  | "recibido"
  | "preparacion"
  | "listo_retiro"
  | "enviado"
  | "entregado"
  | "cancelado";

export type CustomerOrderDelivery = "retiro" | "envio";

export type ShopifyOrderStatusSnapshot = {
  cancelledAt: string | null;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  shippingLineTitle: string | null;
  fulfillments: {
    deliveredAt: string | null;
    displayStatus: string | null;
    trackingNumbers: (string | null)[];
  }[];
  fulfillmentOrders: {
    status: string | null;
    requestStatus: string | null;
    methodType: string | null;
  }[];
  events: { message: string | null }[];
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPickupTitle(title: string | null): boolean {
  if (!title) return false;
  const normalized = normalize(title).trim();

  return (
    /\b(retiro|recogida|pickup|pick up)\b/.test(normalized) ||
    normalized === "tienda olffy"
  );
}

function eventMatches(
  events: ShopifyOrderStatusSnapshot["events"],
  pattern: RegExp,
): boolean {
  return events.some((event) => pattern.test(normalize(event.message ?? "")));
}

function hasReadyForPickupEvent(
  events: ShopifyOrderStatusSnapshot["events"],
): boolean {
  return eventMatches(
    events,
    /ready for (?:customer )?pickup|listo para (?:el )?retiro|preparad[oa] para (?:el )?retiro/,
  );
}

function hasPickedUpEvent(
  events: ShopifyOrderStatusSnapshot["events"],
): boolean {
  return eventMatches(
    events,
    /marked .* as picked up|picked up (?:this|the) order|order .* (?:was )?picked up|marco .* como retirad|pedido retirado/,
  );
}

export function resolveCustomerOrderStatus(
  fallbackStatus: CustomerOrderStatus,
  order: ShopifyOrderStatusSnapshot,
): { estado: CustomerOrderStatus; entrega: CustomerOrderDelivery } {
  const readyForPickup = hasReadyForPickupEvent(order.events);
  const pickedUp = hasPickedUpEvent(order.events);
  const pickupFulfillmentOrders = order.fulfillmentOrders.filter(
    (fulfillmentOrder) =>
      fulfillmentOrder.methodType === "PICK_UP" ||
      fulfillmentOrder.methodType === "PICKUP_POINT",
  );
  const entrega: CustomerOrderDelivery =
    readyForPickup ||
    pickedUp ||
    pickupFulfillmentOrders.length > 0 ||
    isPickupTitle(order.shippingLineTitle)
      ? "retiro"
      : order.shippingLineTitle
        ? "envio"
        : "retiro";
  const fulfillmentStatuses = new Set(
    order.fulfillments.map((fulfillment) => fulfillment.displayStatus),
  );
  const hasTracking = order.fulfillments.some((fulfillment) =>
    fulfillment.trackingNumbers.some(Boolean),
  );
  const paid = ["PAID", "PARTIALLY_PAID", "AUTHORIZED"].includes(
    order.displayFinancialStatus ?? "",
  );

  if (order.cancelledAt || order.displayFinancialStatus === "VOIDED") {
    return { estado: "cancelado", entrega };
  }

  if (entrega === "envio") {
    if (
      fulfillmentStatuses.has("DELIVERED") ||
      order.fulfillments.some((fulfillment) => fulfillment.deliveredAt)
    ) {
      return { estado: "entregado", entrega };
    }
    if (
      hasTracking ||
      fulfillmentStatuses.has("IN_TRANSIT") ||
      fulfillmentStatuses.has("OUT_FOR_DELIVERY") ||
      fulfillmentStatuses.has("ATTEMPTED_DELIVERY") ||
      order.displayFulfillmentStatus === "FULFILLED" ||
      order.displayFulfillmentStatus === "PARTIALLY_FULFILLED"
    ) {
      return { estado: "enviado", entrega };
    }
    return { estado: paid ? "preparacion" : fallbackStatus, entrega };
  }

  if (
    pickedUp ||
    pickupFulfillmentOrders.some(
      (fulfillmentOrder) => fulfillmentOrder.status === "CLOSED",
    ) ||
    fulfillmentStatuses.has("PICKED_UP") ||
    fulfillmentStatuses.has("DELIVERED")
  ) {
    return { estado: "entregado", entrega };
  }
  if (
    readyForPickup ||
    pickupFulfillmentOrders.some(
      (fulfillmentOrder) => fulfillmentOrder.status === "IN_PROGRESS",
    ) ||
    fulfillmentStatuses.has("READY_FOR_PICKUP") ||
    fulfillmentStatuses.has("FULFILLED") ||
    order.displayFulfillmentStatus === "FULFILLED"
  ) {
    return { estado: "listo_retiro", entrega };
  }

  return { estado: paid ? "preparacion" : fallbackStatus, entrega };
}
