export const ADMIN_PERMISSIONS = [
  "dashboard",
  "ventas",
  "pos",
  "clientes",
  "puntos",
  "recompensas",
  "productos",
  "colecciones",
  "ajustes",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminRole = "owner" | "manager" | "cashier" | "custom";

export const ADMIN_ROLE_PERMISSIONS: Record<
  Exclude<AdminRole, "custom">,
  AdminPermission[]
> = {
  owner: [...ADMIN_PERMISSIONS],
  manager: [
    "dashboard",
    "ventas",
    "pos",
    "clientes",
    "puntos",
    "recompensas",
    "productos",
    "colecciones",
  ],
  cashier: ["dashboard", "ventas", "pos", "clientes"],
};

export function isAdminRole(value: unknown): value is AdminRole {
  return ["owner", "manager", "cashier", "custom"].includes(String(value));
}

export function normalizeAdminPermissions(
  role: AdminRole,
  value: unknown,
): AdminPermission[] {
  if (role !== "custom") return [...ADMIN_ROLE_PERMISSIONS[role]];

  const requested = Array.isArray(value) ? value.map(String) : [];
  return ADMIN_PERMISSIONS.filter((permission) =>
    requested.includes(permission),
  );
}
