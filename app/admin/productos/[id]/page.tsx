import { ProductForm } from "components/admin/product-form";
import { getAdminProduct } from "lib/shopify/admin";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  // Reconstruimos el ID de Shopify (Shopify Admin API requiere GIDs completos)
  const { id } = await params;
  const fullId = `gid://shopify/Product/${id}`;
  
  const product = await getAdminProduct(fullId);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductForm initialData={product} isEdit />
    </div>
  );
}
