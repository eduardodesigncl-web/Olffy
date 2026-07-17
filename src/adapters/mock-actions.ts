// ── Mock Actions — stub implementations that log and return success ───────────
// Replace these with real backend calls in Codex integration phase.

// ── Navigation ────────────────────────────────────────────────────────────────
export const goHome = async () => {
  console.log("[MOCK] goHome");
};
export const goTienda = async () => {
  console.log("[MOCK] goTienda");
};
export const goNovedades = async () => {
  console.log("[MOCK] goNovedades");
};
export const goRegalos = async () => {
  console.log("[MOCK] goRegalos");
};
export const goHistoria = async () => {
  console.log("[MOCK] goHistoria");
};
export const goContacto = async () => {
  console.log("[MOCK] goContacto");
};
export const goCuenta = async () => {
  console.log("[MOCK] goCuenta");
};
export const goPuntos = async () => {
  console.log("[MOCK] goPuntos");
};

// ── Tienda ────────────────────────────────────────────────────────────────────
export const openProduct = async (productId: string) => {
  console.log("[MOCK] openProduct", { productId });
  return { success: true };
};
export const closeProduct = async () => {
  console.log("[MOCK] closeProduct");
};
export const selectProductVariant = async (
  productId: string,
  variantId: string,
) => {
  console.log("[MOCK] selectProductVariant", { productId, variantId });
  return { success: true };
};
export const changeProductQuantity = async (quantity: number) => {
  console.log("[MOCK] changeProductQuantity", { quantity });
  return { success: true };
};
export const addToCart = async (
  productId: string,
  variantId: string,
  qty: number,
) => {
  console.log("[MOCK] addToCart", { productId, variantId, qty });
  return { success: true };
};

// ── Carrito ───────────────────────────────────────────────────────────────────
export const openCart = async () => {
  console.log("[MOCK] openCart");
};
export const closeCart = async () => {
  console.log("[MOCK] closeCart");
};
export const incrementCartLine = async (lineId: string) => {
  console.log("[MOCK] incrementCartLine", { lineId });
  return { success: true };
};
export const decrementCartLine = async (lineId: string) => {
  console.log("[MOCK] decrementCartLine", { lineId });
  return { success: true };
};
export const removeCartLine = async (lineId: string) => {
  console.log("[MOCK] removeCartLine", { lineId });
  return { success: true };
};
export const goCheckout = async () => {
  console.log("[MOCK] goCheckout");
};

// ── Checkout ──────────────────────────────────────────────────────────────────
export const submitCheckout = async (form: Record<string, unknown>) => {
  console.log("[MOCK] submitCheckout", form);
  return { success: true, orderId: "mock-order-001" };
};
export const applyDiscountCode = async (code: string) => {
  console.log("[MOCK] applyDiscountCode", { code });
  const validCodes: Record<string, number> = { OLFFY10: 0.1, BIENVENIDA: 0.15 };
  if (validCodes[code.toUpperCase()]) {
    return { success: true, discount: validCodes[code.toUpperCase()] };
  }
  return { success: false, error: "Código no válido" };
};
export const removeDiscountCode = async () => {
  console.log("[MOCK] removeDiscountCode");
  return { success: true };
};

// ── Cuenta cliente ────────────────────────────────────────────────────────────
export const requestMagicLink = async (email: string) => {
  console.log("[MOCK] requestMagicLink", { email });
  return { success: true };
};
export const logoutCustomer = async () => {
  console.log("[MOCK] logoutCustomer");
  return { success: true };
};
export const requestRewardRedemption = async (rewardId: string) => {
  console.log("[MOCK] requestRewardRedemption", { rewardId });
  return { success: true, redemptionId: "mock-redemp-001" };
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminLogin = async (password: string) => {
  console.log("[MOCK] adminLogin", { password: "***" });
  return { success: true };
};
export const adminLogout = async () => {
  console.log("[MOCK] adminLogout");
  return { success: true };
};
export const createCustomer = async (data: Record<string, unknown>) => {
  console.log("[MOCK] createCustomer", data);
  return { success: true, customerId: "mock-cust-new" };
};
export const searchCustomer = async (query: string) => {
  console.log("[MOCK] searchCustomer", { query });
  return { success: true, results: [] };
};
export const adjustCustomerPoints = async (
  customerId: string,
  points: number,
  motivo: string,
  responsable: string,
  comprobante?: string,
) => {
  console.log("[MOCK] adjustCustomerPoints", {
    customerId,
    points,
    motivo,
    responsable,
    comprobante,
  });
  return { success: true };
};
export const registerTuuSale = async (data: Record<string, unknown>) => {
  console.log("[MOCK] registerTuuSale", data);
  return { success: true, saleId: "mock-sale-new" };
};
export const approveRedemption = async (
  redemptionId: string,
  responsable: string,
) => {
  console.log("[MOCK] approveRedemption", { redemptionId, responsable });
  return { success: true, code: "OLFFY-MOCK-CODE" };
};
export const rejectRedemption = async (
  redemptionId: string,
  motivo: string,
  responsable: string,
) => {
  console.log("[MOCK] rejectRedemption", { redemptionId, motivo, responsable });
  return { success: true };
};
export const createReward = async (data: Record<string, unknown>) => {
  console.log("[MOCK] createReward", data);
  return { success: true, rewardId: "mock-reward-new" };
};
export const updateReward = async (
  rewardId: string,
  data: Record<string, unknown>,
) => {
  console.log("[MOCK] updateReward", { rewardId, ...data });
  return { success: true };
};
export const deleteReward = async (rewardId: string) => {
  console.log("[MOCK] deleteReward", { rewardId });
  return { success: true };
};
export const createProduct = async (data: Record<string, unknown>) => {
  console.log("[MOCK] createProduct", data);
  return { success: true, productId: "mock-prod-new" };
};
export const updateProduct = async (
  productId: string,
  data: Record<string, unknown>,
) => {
  console.log("[MOCK] updateProduct", { productId, ...data });
  return { success: true };
};
export const deleteProduct = async (productId: string) => {
  console.log("[MOCK] deleteProduct", { productId });
  return { success: true };
};
export const updateInventory = async (variantId: string, quantity: number) => {
  console.log("[MOCK] updateInventory", { variantId, quantity });
  return { success: true };
};
export const retryBoleta = async (saleId: string) => {
  console.log("[MOCK] retryBoleta", { saleId });
  return { success: true };
};
export const processMarketingEvent = async (
  eventName: string,
  data: Record<string, unknown>,
) => {
  console.log("[MOCK] processMarketingEvent", { eventName, ...data });
  return { success: true };
};
