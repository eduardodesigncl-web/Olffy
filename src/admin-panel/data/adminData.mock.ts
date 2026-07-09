import type { AdminMetric } from "../types";

// 1:1 con this.ADMIN_DATA + los KPIs estáticos del dashboard del original.

export interface AdminCliente {
  idx: number;
  nombre: string;
  email: string;
  tel?: string;
  puntos: number;
  estado: string;
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
  nombre: string;
  handle: string;
  productos: number;
}

export const ADMIN_DATA = {
  clientes: [
    {
      idx: 0,
      nombre: "Valentina García",
      email: "vale@example.com",
      tel: "+56912345678",
      puntos: 1240,
      estado: "Activo",
    },
    {
      idx: 1,
      nombre: "Camila Torres",
      email: "cami@example.com",
      tel: "+56923456789",
      puntos: 3420,
      estado: "Activo",
    },
    {
      idx: 2,
      nombre: "Milenka Burgos",
      email: "milenka@example.com",
      tel: "+56986416035",
      puntos: 2200,
      estado: "Activo",
    },
  ] satisfies AdminCliente[],

  canjesPendientes: [
    {
      beneficio: "$3.000 de descuento",
      pts: "300 pts · sin vencimiento",
      cliente: "Milenka Burgos",
      fecha: "27-06-2026, 1:24 p.m.",
      estado: "Solicitado",
    },
  ] satisfies AdminCanje[],

  historialCliente: [
    {
      fecha: "27-06-2026, 1:24 p.m.",
      movimiento: "Canje",
      puntos: "-300",
      saldo: "1.700",
      detalle: "Reserva para canje de $3.000 de descuento",
    },
    {
      fecha: "27-06-2026, 1:23 p.m.",
      movimiento: "Ajuste",
      puntos: "+2.000",
      saldo: "2.000",
      detalle: "Cumpleaños",
    },
  ] satisfies AdminHistorialItem[],

  productos: [
    {
      nombre: "Cuaderno Ilustrado A5",
      handle: "cuaderno-ilustrado-a5",
      estado: "ACTIVE",
      stock: "18 en stock",
      precio: "$8.990",
    },
    {
      nombre: "Agenda Semanal 2025",
      handle: "agenda-semanal-2025",
      estado: "ACTIVE",
      stock: "7 en stock",
      precio: "$12.990",
    },
  ] satisfies AdminProductoRow[],

  colecciones: [
    { nombre: "Página de inicio", handle: "frontpage", productos: 20 },
  ] satisfies AdminColeccionRow[],
};

export const DASHBOARD_METRICS: AdminMetric[] = [
  {
    label: "Ventas hoy",
    value: "$384.780",
    footnote: "↑ 18% vs ayer",
    color: "morado",
  },
  {
    label: "Pedidos pendientes",
    value: 12,
    footnote: "por preparar",
    color: "amarillo",
  },
  {
    label: "Clientes activos",
    value: 342,
    footnote: "↑ 24 esta semana",
    color: "morado-suave",
  },
  {
    label: "Puntos en circulación",
    value: "48.620",
    footnote: "en circulación",
    color: "amarillo-suave",
  },
];
