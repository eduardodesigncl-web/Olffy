// Ventas digitales (mock/local). Representan órdenes de la tienda online que en
// producción vendrían desde Shopify (pagos vía Mercado Pago u otra pasarela).
// No es un POS: aquí solo se visualizan; no se registran ventas manualmente.

export type DigitalPayStatus = "Pagado" | "Pendiente" | "Reembolsado";

export interface DigitalSaleItem {
  nombre: string;
  qty: number;
  precio: string;
}

export interface DigitalSale {
  id: number;
  folio: string;
  cliente: string;
  email: string;
  fecha: string;
  total: string;
  totalN: number;
  metodoPago: string;
  estadoPago: DigitalPayStatus;
  canal: string;
  puntos: number;
  supabaseSync: boolean;
  productos: DigitalSaleItem[];
}

export const DIGITAL_SALES: DigitalSale[] = [
  {
    id: 5210,
    folio: "#OLF-5210",
    cliente: "Valentina García",
    email: "vale@example.com",
    fecha: "08-07-2026, 10:24",
    total: "$21.980",
    totalN: 21980,
    metodoPago: "Mercado Pago",
    estadoPago: "Pagado",
    canal: "Web / Shopify",
    puntos: 219,
    supabaseSync: true,
    productos: [
      { nombre: "Cuaderno Ilustrado A5", qty: 1, precio: "$8.990" },
      { nombre: "Agenda Semanal 2025", qty: 1, precio: "$12.990" },
    ],
  },
  {
    id: 5209,
    folio: "#OLF-5209",
    cliente: "Camila Torres",
    email: "cami@example.com",
    fecha: "08-07-2026, 09:03",
    total: "$12.990",
    totalN: 12990,
    metodoPago: "Mercado Pago",
    estadoPago: "Pagado",
    canal: "Web / Shopify",
    puntos: 129,
    supabaseSync: false,
    productos: [{ nombre: "Agenda Semanal 2025", qty: 1, precio: "$12.990" }],
  },
  {
    id: 5208,
    folio: "#OLF-5208",
    cliente: "Cliente invitado",
    email: "invitado@olffy.cl",
    fecha: "07-07-2026, 18:41",
    total: "$4.990",
    totalN: 4990,
    metodoPago: "Tarjeta de crédito",
    estadoPago: "Pendiente",
    canal: "Web / Shopify",
    puntos: 0,
    supabaseSync: false,
    productos: [
      { nombre: "Kit de Stickers Florales", qty: 1, precio: "$4.990" },
    ],
  },
  {
    id: 5207,
    folio: "#OLF-5207",
    cliente: "Milenka Burgos",
    email: "milenka@example.com",
    fecha: "07-07-2026, 16:12",
    total: "$24.990",
    totalN: 24990,
    metodoPago: "Mercado Pago",
    estadoPago: "Pagado",
    canal: "Web / Shopify",
    puntos: 249,
    supabaseSync: true,
    productos: [
      { nombre: "Kit Papelería Completo", qty: 1, precio: "$24.990" },
    ],
  },
  {
    id: 5206,
    folio: "#OLF-5206",
    cliente: "Cliente invitado",
    email: "invitado@olffy.cl",
    fecha: "07-07-2026, 11:58",
    total: "$9.980",
    totalN: 9980,
    metodoPago: "Tarjeta de débito",
    estadoPago: "Reembolsado",
    canal: "Web / Shopify",
    puntos: 0,
    supabaseSync: false,
    productos: [{ nombre: "Marcapáginas Set x4", qty: 2, precio: "$3.490" }],
  },
];
