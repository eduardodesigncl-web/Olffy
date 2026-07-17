"use client";

import { useRouter } from "next/navigation";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import type { Product } from "../types";
import { useOpenProduct } from "./OlffyChrome";

// Página de detalle /tienda/[handle]: la ProductDetailPage del frontend
// oficial sobre el router real; los relacionados llegan del servidor.
export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const openProduct = useOpenProduct();

  return (
    <ProductDetailPage
      product={product}
      relatedProducts={relatedProducts}
      onProductClick={openProduct}
      onGoToTienda={() => router.push("/tienda")}
    />
  );
}
