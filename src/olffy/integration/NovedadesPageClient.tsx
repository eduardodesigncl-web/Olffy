"use client";

import { useRouter } from "next/navigation";
import { NovedadesPage } from "../pages/NovedadesPage";
import type { Product } from "../types";
import { subscribeNewsletterAction } from "./marketing-actions";
import { PAGE_ROUTES, useOpenProduct } from "./OlffyChrome";

export function NovedadesPageClient({
  newProducts,
}: {
  newProducts: Product[];
}) {
  const router = useRouter();
  const openProduct = useOpenProduct();

  return (
    <NovedadesPage
      newProducts={newProducts}
      onProductClick={openProduct}
      onNavigate={(page) => router.push(PAGE_ROUTES[page])}
      onNotify={subscribeNewsletterAction}
    />
  );
}
