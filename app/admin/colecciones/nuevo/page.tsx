import { CollectionForm } from "components/admin/collection-form";
import { requireAdminPageSession } from "lib/admin/auth";

export default async function NuevaColeccionPage() {
  await requireAdminPageSession();

  return (
    <div className="space-y-6">
      <CollectionForm />
    </div>
  );
}
