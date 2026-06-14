import { ProductForm } from "components/admin/product-form";
import { getAdminProduct } from "lib/shopify/admin";
import { normalizeShopifyGid } from "lib/shopify/gid";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const product = await getAdminProduct(normalizeShopifyGid("Product", id));

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductForm initialData={product} isEdit />
    </div>
  );
}
