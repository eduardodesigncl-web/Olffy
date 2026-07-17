import { getProducts } from "lib/shopify";
import { toOlffyProducts } from "src/olffy/integration/mappers";
import { NovedadesPageClient } from "src/olffy/integration/NovedadesPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Novedades",
  description:
    "Nuevas colecciones y productos recién llegados a OLFFY: papelería ilustrada desde Viña del Mar.",
};

export default async function NoveltiesPage() {
  const shopifyProducts = await getProducts({
    sortKey: "CREATED_AT",
    reverse: true,
  });

  const products = toOlffyProducts(shopifyProducts);
  const tagged = products.filter((product) => product.tag === "Nuevo");
  // Si nada tiene tag "Nuevo" en Shopify, mostramos los más recientes.
  const newProducts = tagged.length ? tagged : products.slice(0, 8);

  return (
    <OlffyStorefront>
      <NovedadesPageClient newProducts={newProducts} />
    </OlffyStorefront>
  );
}
