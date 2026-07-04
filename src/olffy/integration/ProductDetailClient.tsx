"use client";

import { useRouter } from "next/navigation";
import { ProductModal } from "../components/product";
import type { Product } from "../types";

// Página de detalle /tienda/[handle]: reutiliza el ProductModal del frontend
// oficial abierto sobre la tienda; al cerrar vuelve al catálogo.
export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <ProductModal product={product} onClose={() => router.push("/tienda")} />
  );
}
