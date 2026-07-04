import { SiteFooter } from "components/olffy/site-footer";
import { getOlffyProducts } from "components/olffy/shopify-products";
import { StoreProductBrowser } from "components/olffy/store-product-browser";

export const metadata = {
  title: "Buscar productos",
  description: "Busca productos OLFFY en la tienda.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = params?.q;
  const products = await getOlffyProducts();

  return (
    <>
      <StoreProductBrowser
        products={products}
        initialQuery={typeof query === "string" ? query : ""}
      />
      <SiteFooter />
    </>
  );
}
