import { redirect } from "next/navigation";
import { getOlffyProducts } from "components/olffy/shopify-products";

export async function generateStaticParams() {
  const products = await getOlffyProducts();

  return products.length
    ? products.map((product) => ({ handle: product.handle }))
    : [{ handle: "__missing-product__" }];
}

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  redirect(`/producto/${handle}`);
}
