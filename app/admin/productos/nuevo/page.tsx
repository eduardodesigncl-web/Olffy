import { ProductForm } from "components/admin/product-form";
import { requireAdminPagePermission } from "lib/admin/auth";

export default async function NuevoProductoPage() {
  await requireAdminPagePermission("productos");

  return (
    <div className="space-y-6">
      <ProductForm />
    </div>
  );
}
