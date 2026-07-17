import { redirect } from "next/navigation";
import { requireAdminPagePermission } from "lib/admin/auth";

// Ruta antigua: las ventas digitales viven ahora en la seccion unificada
// de Ventas, filtradas por origen online.
export default async function LegacyDigitalSalesPage() {
  await requireAdminPagePermission("ventas");
  redirect("/admin/ventas?vista=historial&origen=online");
}
