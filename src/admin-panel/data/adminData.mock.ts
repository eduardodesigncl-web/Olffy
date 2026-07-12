import type { AdminMetric } from "../types";

// 1:1 con this.ADMIN_DATA + los KPIs estáticos del dashboard del original.

export interface AdminCliente {
  idx: number;
  nombre: string;
  email: string;
  tel?: string;
  puntos: number;
  estado: string;
  createdAt?: string;
}

export interface AdminCanje {
  id?: string;
  beneficio: string;
  pts: string;
  cliente: string;
  fecha: string;
  estado: string;
}

export interface AdminHistorialItem {
  fecha: string;
  movimiento: string;
  puntos: string;
  saldo: string;
  detalle: string;
}

export interface AdminProductoRow {
  nombre: string;
  handle: string;
  estado: string;
  stock: string;
  precio: string;
}

export interface AdminColeccionRow {
  id?: string;
  nombre: string;
  handle: string;
  productos: number;
}

// Contenedores vivos del panel: nacen vacíos y se llenan con datos reales en
// hydrateAdminPanelData(). No deben contener datos ficticios: si la hidratación
// falla, el panel muestra estados vacíos en lugar de información inventada.
export const ADMIN_DATA = {
  clientes: [] as AdminCliente[],
  canjesPendientes: [] as AdminCanje[],
  historialCliente: [] as AdminHistorialItem[],
  productos: [] as AdminProductoRow[],
  colecciones: [] as AdminColeccionRow[],
};

export const DASHBOARD_METRICS: AdminMetric[] = [];
