import { redirect } from "next/navigation";

// Ruta antigua: las ventas digitales viven ahora en la seccion unificada
// de Ventas, filtradas por origen online.
export default function LegacyDigitalSalesPage() {
  redirect("/admin/ventas?vista=historial&origen=online");
}
