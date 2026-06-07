import { redirect } from "next/navigation";
import { getOlffyProducts } from "components/olffy/shopify-products";

export async function generateStaticParams() {
  const products = await getOlffyProducts();

  return products.map((product) => ({ handle: product.handle }));
}

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  redirect(`/producto/${handle}`);
}
