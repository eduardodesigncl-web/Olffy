// Responsables internos (mock/local). Lista base compartida por el flujo de
// Ventas físicas y por las acciones del detalle de cliente (ajustes, canjes,
// reversas). En producción vendría de los usuarios internos con permisos.
export interface AdminResponsibleOption {
  id: string;
  nombre: string;
  cargo: string;
}

export const ADMIN_RESPONSIBLES_MOCK: AdminResponsibleOption[] = [
  { id: "maria-jose", nombre: "María José", cargo: "Vendedora" },
  { id: "equipo-olffy", nombre: "Equipo OLFFY", cargo: "Tienda" },
  { id: "admin", nombre: "Administradora", cargo: "Admin" },
];

// Etiqueta visible "Nombre — Cargo".
export function responsibleLabel(r: { nombre: string; cargo: string }): string {
  return `${r.nombre} — ${r.cargo}`;
}
