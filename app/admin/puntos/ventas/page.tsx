import { redirect } from "next/navigation";
import { requireAdminPagePermission } from "lib/admin/auth";

// Ruta antigua del POS manual: la caja operativa es ahora la Tienda POS.
export default async function LegacyPhysicalSalesPage() {
  await requireAdminPagePermission("pos");
  redirect("/admin/pos");
}
