"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "../pages/HomePage";
import type { Product } from "../types";
import { PAGE_ROUTES, useProductModal } from "./OlffyChrome";

export function HomePageClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const openProduct = useProductModal();

  return (
    <HomePage
      products={products}
      onProductClick={openProduct}
      onNavigate={(page) => router.push(PAGE_ROUTES[page])}
    />
  );
}
