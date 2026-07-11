import { requireAdminPageSession } from "lib/admin/auth";
import { connection } from "next/server";
import { getAdminPanelData } from "src/admin-panel/integration/get-admin-panel-data";
import { AdminPanelClient } from "src/admin-panel/integration/AdminPanelClient";

// Tienda POS: caja para ventas presenciales con cobro por la máquina TUU.
export default async function AdminPosPage() {
  await requireAdminPageSession();
  await connection();

  const data = await getAdminPanelData();

  return <AdminPanelClient data={data} initialTab="pos" />;
}
