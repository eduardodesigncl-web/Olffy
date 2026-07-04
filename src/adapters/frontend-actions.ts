// ── Frontend Actions — public interface ───────────────────────────────────────
// Re-exports mock-actions. Swap real backend implementations here.
// Components should import from this file only, never from mock-actions directly.

export { requestMagicLink, logoutCustomer } from "./supabase-auth-actions";
export { adminLogin, adminLogout } from "./admin-auth-actions";
export {
  adjustCustomerPoints,
  registerTuuSale,
  approveRedemption,
  rejectRedemption,
  retryBoleta,
} from "./supabase-admin-actions";

export {
  // Navigation
  goHome,
  goTienda,
  goNovedades,
  goRegalos,
  goHistoria,
  goContacto,
  goCuenta,
  goPuntos,
  // Tienda
  openProduct,
  closeProduct,
  selectProductVariant,
  changeProductQuantity,
  addToCart,
  // Carrito
  openCart,
  closeCart,
  incrementCartLine,
  decrementCartLine,
  removeCartLine,
  goCheckout,
  // Checkout
  submitCheckout,
  applyDiscountCode,
  removeDiscountCode,
  requestRewardRedemption,
  // Admin
  createCustomer,
  searchCustomer,
  createReward,
  updateReward,
  deleteReward,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  processMarketingEvent,
} from "./mock-actions";
