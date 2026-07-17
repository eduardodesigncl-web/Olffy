import { Suspense } from "react";
import { getProducts } from "lib/shopify";
import {
  toOlffyCategories,
  toOlffyProducts,
} from "src/olffy/integration/mappers";
import { OlffyStorefront } from "src/olffy/integration/shell";
import { TiendaPageClient } from "src/olffy/integration/TiendaPageClient";

export const metadata = {
  title: "Tienda",
  description: "Papelería ilustrada OLFFY para organizar, crear y regalar.",
};

export default async function StorePage() {
  const shopifyProducts = await getProducts({
    sortKey: "CREATED_AT",
    reverse: true,
  });
  const products = toOlffyProducts(shopifyProducts);

  return (
    <OlffyStorefront>
      {/* useSearchParams (categoría/búsqueda inicial) exige Suspense para
          mantener la página estática. */}
      <Suspense fallback={null}>
        <TiendaPageClient
          products={products}
          categories={toOlffyCategories(products)}
        />
      </Suspense>
    </OlffyStorefront>
  );
}
