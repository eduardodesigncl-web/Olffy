import { getProducts } from "lib/shopify";
import { HomePageClient } from "src/olffy/integration/HomePageClient";
import { toOlffyProducts } from "src/olffy/integration/mappers";
import { OlffyStorefront } from "src/olffy/integration/shell";

export default async function HomePage() {
  const products = await getProducts({
    sortKey: "CREATED_AT",
    reverse: true,
  });

  return (
    <OlffyStorefront>
      <HomePageClient products={toOlffyProducts(products)} />
    </OlffyStorefront>
  );
}
