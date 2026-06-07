import { ProductForm } from "components/admin/product-form";
import { getAdminProduct } from "lib/shopify/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: { id: string };
}) {
  // Reconstruimos el ID de Shopify (Shopify Admin API requiere GIDs completos)
  const fullId = `gid://shopify/Product/${params.id}`;
  
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
