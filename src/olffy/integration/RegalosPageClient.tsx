"use client";

import { RegalosPage } from "../pages/RegalosPage";
import type { Product } from "../types";
import { useOpenProduct } from "./OlffyChrome";

export function RegalosPageClient({
  products,
  giftProducts,
}: {
  products: Product[];
  giftProducts: Product[];
}) {
  const openProduct = useOpenProduct();

  return (
    <RegalosPage
      products={products}
      giftProducts={giftProducts}
      onProductClick={openProduct}
    />
  );
}
