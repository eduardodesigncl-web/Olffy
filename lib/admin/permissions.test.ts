import { describe, expect, it } from "vitest";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  normalizeAdminPermissions,
} from "./permissions";

describe("admin role permissions", () => {
  it("gives the owner every permission", () => {
    expect(ADMIN_ROLE_PERMISSIONS.owner).toEqual(ADMIN_PERMISSIONS);
  });

  it("keeps settings exclusive to owners by default", () => {
    expect(ADMIN_ROLE_PERMISSIONS.manager).not.toContain("ajustes");
    expect(ADMIN_ROLE_PERMISSIONS.cashier).not.toContain("ajustes");
  });

  it("limits cashier access to operational tabs", () => {
    expect(ADMIN_ROLE_PERMISSIONS.cashier).toEqual([
      "dashboard",
      "ventas",
      "pos",
      "clientes",
    ]);
  });

  it("filters invalid custom permissions", () => {
    expect(
      normalizeAdminPermissions("custom", [
        "dashboard",
        "puntos",
        "not-a-permission",
      ]),
    ).toEqual(["dashboard", "puntos"]);
  });
});
