import { CollectionForm } from "components/admin/collection-form";
import { getAdminCollection } from "lib/shopify/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarColeccionPage({
  params,
}: {
  params: { id: string };
}) {
  const fullId = `gid://shopify/Collection/${params.id}`;
  const collection = await getAdminCollection(fullId);

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CollectionForm initialData={collection} isEdit />
    </div>
  );
}
