import { getProducts } from "lib/shopify";
import { toOlffyProducts } from "src/olffy/integration/mappers";
import { RegalosPageClient } from "src/olffy/integration/RegalosPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Regalos",
  description:
    "Kits de papelería y regalos ilustrados OLFFY para amigas, estudiantes y amantes del diseño.",
};

export default async function GiftsPage() {
  const shopifyProducts = await getProducts({
    sortKey: "CREATED_AT",
    reverse: true,
  });
  const products = toOlffyProducts(shopifyProducts);
  const gifts = products.filter(
    (product) =>
      product.tag === "Especial" ||
      product.cat.toLowerCase() === "regalos" ||
      product.n <= 10000,
  );

  return (
    <OlffyStorefront>
      <RegalosPageClient products={gifts.length ? gifts : products} />
    </OlffyStorefront>
  );
}
