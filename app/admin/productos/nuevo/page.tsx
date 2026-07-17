import { ProductForm } from "components/admin/product-form";
import { requireAdminPageSession } from "lib/admin/auth";

export default async function NuevoProductoPage() {
  await requireAdminPageSession();

  return (
    <div className="space-y-6">
      <ProductForm />
    </div>
  );
}
