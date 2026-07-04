"use client";

import { TiendaPage } from "../pages/TiendaPage";
import type { Product } from "../types";
import { useProductModal } from "./OlffyChrome";

export function TiendaPageClient({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const openProduct = useProductModal();

  return (
    <TiendaPage
      products={products}
      categories={categories}
      onProductClick={openProduct}
    />
  );
}
