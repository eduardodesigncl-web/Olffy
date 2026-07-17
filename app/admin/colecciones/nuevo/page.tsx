import { CollectionForm } from "components/admin/collection-form";
import { requireAdminPagePermission } from "lib/admin/auth";

export default async function NuevaColeccionPage() {
  await requireAdminPagePermission("colecciones");

  return (
    <div className="space-y-6">
      <CollectionForm />
    </div>
  );
}
