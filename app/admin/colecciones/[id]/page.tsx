import { CollectionForm } from "components/admin/collection-form";
import { getAdminCollection } from "lib/shopify/admin";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function EditarColeccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const fullId = `gid://shopify/Collection/${id}`;
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
