import { requireAdminPagePermission } from "lib/admin/auth";
import { connection } from "next/server";
import { getAdminPanelData } from "src/admin-panel/integration/get-admin-panel-data";
import { AdminPanelClient } from "src/admin-panel/integration/AdminPanelClient";
import { filterAdminPanelData } from "src/admin-panel/integration/filter-admin-panel-data";

// Sección madre de Ventas: pestañas "Ventas del día" e "Historial de ventas"
// con ventas online y físicas unificadas. Los filtros viven en la query string.
export default async function AdminVentasPage() {
  const actor = await requireAdminPagePermission("ventas");
  await connection();

  const data = filterAdminPanelData(
    await getAdminPanelData(),
    actor.permissions,
  );

  return (
    <AdminPanelClient
      data={data}
      initialTab="ventas"
      allowedTabs={[
        ...actor.permissions,
        ...(actor.permissions.includes("clientes")
          ? (["soporte"] as const)
          : []),
      ]}
    />
  );
}
