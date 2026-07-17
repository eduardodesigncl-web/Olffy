import type { AdminPermission } from "lib/admin/permissions";
import type { AdminPanelData } from "./types";

function has(
  permissions: readonly AdminPermission[],
  ...required: AdminPermission[]
) {
  return required.some((permission) => permissions.includes(permission));
}

export function filterAdminPanelData(
  data: AdminPanelData,
  permissions: readonly AdminPermission[],
): AdminPanelData {
  const canSeeCustomers = has(permissions, "clientes");
  const canSeeSales = has(permissions, "ventas");
  const canUsePos = has(permissions, "pos");
  const canSeePoints = has(permissions, "puntos");
  const canSeeRewards = has(permissions, "recompensas");
  const canSeeProducts = has(permissions, "productos");
  const canSeeCollections = has(permissions, "colecciones");
  const canSeeDashboard = has(permissions, "dashboard");
  const canSeeSettings = has(permissions, "ajustes");

  return {
    ...data,
    posReadiness: canUsePos
      ? data.posReadiness
      : {
          shopify: false,
          discounts: false,
          tuuRemote: false,
          tuuWebhook: false,
          shopifyWebhooks: false,
        },
    adminData: {
      clientes: canSeeCustomers ? data.adminData.clientes : [],
      canjesPendientes: canSeeRewards ? data.adminData.canjesPendientes : [],
      historialCliente: canSeePoints ? data.adminData.historialCliente : [],
      productos: canSeeProducts || canUsePos ? data.adminData.productos : [],
      colecciones: canSeeCollections ? data.adminData.colecciones : [],
    },
    dashboardMetrics: canSeeDashboard ? data.dashboardMetrics : [],
    products: canSeeProducts || canUsePos ? data.products : [],
    sales: canSeeSales ? data.sales : [],
    loyaltyRule: canSeePoints || canUsePos ? data.loyaltyRule : null,
    physicalSalesHistory:
      canSeeSales || canUsePos ? data.physicalSalesHistory : [],
    pointMovements: canSeePoints ? data.pointMovements : [],
    rewards: canSeeRewards || canUsePos ? data.rewards : [],
    abandonedCheckouts: canSeeSales
      ? data.abandonedCheckouts
      : {
          available: false,
          source: data.abandonedCheckouts.source,
          fetchedAt: data.abandonedCheckouts.fetchedAt,
          count: 0,
          totalAmount: 0,
          checkouts: [],
        },
    storeInfo: canSeeSettings ? data.storeInfo : null,
    shopifyAdminUrl:
      canSeeProducts || canSeeCollections || canSeeSettings
        ? data.shopifyAdminUrl
        : "",
  };
}
