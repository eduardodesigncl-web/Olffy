"use client";

import { useRouter } from "next/navigation";
import {
  NovedadesPage,
  type NovedadesCollection,
} from "../pages/NovedadesPage";
import type { Product } from "../types";
import { useProductModal } from "./OlffyChrome";

export function NovedadesPageClient({
  newProducts,
  collections,
}: {
  newProducts: Product[];
  collections: NovedadesCollection[];
}) {
  const router = useRouter();
  const openProduct = useProductModal();

  return (
    <NovedadesPage
      newProducts={newProducts}
      collections={collections}
      onProductClick={openProduct}
      onCollectionClick={(path) => router.push(path)}
    />
  );
}
