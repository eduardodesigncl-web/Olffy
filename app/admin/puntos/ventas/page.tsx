import { redirect } from "next/navigation";

// Ruta antigua del POS manual: la caja operativa es ahora la Tienda POS.
export default function LegacyPhysicalSalesPage() {
  redirect("/admin/pos");
}
