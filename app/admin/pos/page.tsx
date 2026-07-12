import { requireAdminPagePermission } from "lib/admin/auth";
import { connection } from "next/server";
import { getAdminPanelData } from "src/admin-panel/integration/get-admin-panel-data";
import { AdminPanelClient } from "src/admin-panel/integration/AdminPanelClient";

// Tienda POS: caja para ventas presenciales con cobro por la máquina TUU.
export default async function AdminPosPage() {
  const actor = await requireAdminPagePermission("pos");
  await connection();

  const data = await getAdminPanelData({ scope: "pos" });

  return (
    <AdminPanelClient
      data={data}
      initialTab="pos"
      navigationMode="routes"
      allowedTabs={actor.permissions}
    />
  );
}
