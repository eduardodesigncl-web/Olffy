import { SiteFooter } from "components/olffy/site-footer";
import { getOlffyProducts } from "components/olffy/shopify-products";
import { StoreProductBrowser } from "components/olffy/store-product-browser";
import type { Metadata } from "next";

const categoryLabels: Record<string, string> = {
  cuadernos: "Cuadernos",
  planners: "Planners",
  stickers: "Stickers",
  papeleria: "Papelería",
  escritura: "Escritura",
  calendarios: "Calendarios",
  regalos: "Regalos",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const category = categoryLabels[collection] ?? "Tienda";

  return {
    title: category,
    description: `Explora ${category.toLowerCase()} OLFFY.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const products = await getOlffyProducts();

  return (
    <>
      <StoreProductBrowser
        products={products}
        initialCategory={categoryLabels[collection] ?? "Todos"}
      />
      <SiteFooter />
    </>
  );
}
