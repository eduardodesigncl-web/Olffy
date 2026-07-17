"use client";

import { useSearchParams } from "next/navigation";
import { TiendaPage } from "../pages/TiendaPage";
import type { Product } from "../types";
import { useOpenProduct } from "./OlffyChrome";

// Lee ?categoria= y ?q= en el cliente (useSearchParams) para que /tienda siga
// siendo 100% prerenderizada; las rutas legacy (/search/...) redirigen aquí
// con esos parámetros.
export function TiendaPageClient({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const openProduct = useOpenProduct();
  const searchParams = useSearchParams();

  const categoriaParam = searchParams.get("categoria")?.trim();
  const initialCategory = categoriaParam
    ? categories.find(
        (cat) => cat.localeCompare(categoriaParam, "es", { sensitivity: "base" }) === 0,
      )
    : undefined;
  const initialQuery = searchParams.get("q")?.trim();

  return (
    <TiendaPage
      products={products}
      categories={categories}
      onProductClick={openProduct}
      {...(initialCategory ? { initialCategory } : {})}
      {...(initialQuery ? { initialQuery } : {})}
    />
  );
}
