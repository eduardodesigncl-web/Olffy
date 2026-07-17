"use client";

import { useRouter } from "next/navigation";
import { HomePage } from "../pages/HomePage";
import type { Product } from "../types";
import { PAGE_ROUTES, useOpenProduct } from "./OlffyChrome";

export function HomePageClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const openProduct = useOpenProduct();

  return (
    <HomePage
      products={products}
      onProductClick={openProduct}
      onNavigate={(page) => router.push(PAGE_ROUTES[page])}
    />
  );
}
