"use client";

import { ADMIN_DATA, DASHBOARD_METRICS } from "../data/adminData.mock";
import { DIGITAL_SALES } from "../data/adminDigitalSales.mock";
import { PRODUCTS } from "../data/products.mock";
import type { AdminPanelData } from "./types";

export const adminPanelRuntime = {
  data: null as AdminPanelData | null,
};

export function hydrateAdminPanelData(data: AdminPanelData) {
  adminPanelRuntime.data = data;

  ADMIN_DATA.clientes.splice(
    0,
    ADMIN_DATA.clientes.length,
    ...data.adminData.clientes,
  );
  ADMIN_DATA.canjesPendientes.splice(
    0,
    ADMIN_DATA.canjesPendientes.length,
    ...data.adminData.canjesPendientes,
  );
  ADMIN_DATA.historialCliente.splice(
    0,
    ADMIN_DATA.historialCliente.length,
    ...data.adminData.historialCliente,
  );
  ADMIN_DATA.productos.splice(
    0,
    ADMIN_DATA.productos.length,
    ...data.adminData.productos,
  );
  ADMIN_DATA.colecciones.splice(
    0,
    ADMIN_DATA.colecciones.length,
    ...data.adminData.colecciones,
  );

  PRODUCTS.splice(0, PRODUCTS.length, ...data.products);
  DIGITAL_SALES.splice(0, DIGITAL_SALES.length, ...data.digitalSales);
  DASHBOARD_METRICS.splice(
    0,
    DASHBOARD_METRICS.length,
    ...data.dashboardMetrics,
  );
}
