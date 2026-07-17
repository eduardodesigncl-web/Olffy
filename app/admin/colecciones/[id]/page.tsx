import { CollectionForm } from "components/admin/collection-form";
import { requireAdminPagePermission } from "lib/admin/auth";
import { getAdminCollection } from "lib/shopify/admin";
import { normalizeShopifyGid } from "lib/shopify/gid";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function EditarColeccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPagePermission("colecciones");
  await connection();

  const { id } = await params;
  const collection = await getAdminCollection(
    normalizeShopifyGid("Collection", id),
  );

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CollectionForm initialData={collection} isEdit />
    </div>
  );
}
