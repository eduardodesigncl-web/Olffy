import { requireAdminPagePermission } from "lib/admin/auth";
import { connection } from "next/server";
import { getAdminPanelData } from "src/admin-panel/integration/get-admin-panel-data";
import { AdminPanelClient } from "src/admin-panel/integration/AdminPanelClient";

// Sección madre de Ventas: pestañas "Ventas del día" e "Historial de ventas"
// con ventas online y físicas unificadas. Los filtros viven en la query string.
export default async function AdminVentasPage() {
  const actor = await requireAdminPagePermission("ventas");
  await connection();

  const data = await getAdminPanelData();

  return (
    <AdminPanelClient
      data={data}
      initialTab="ventas"
      allowedTabs={actor.permissions}
    />
  );
}
