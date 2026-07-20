import { NextResponse, type NextRequest } from "next/server";
import { getProducts } from "lib/shopify";
import {
  isSearchableQuery,
  rankProducts,
  MAX_RESULTS,
  type SearchResultDto,
} from "lib/search/product-search";
import { toOlffyProducts } from "src/olffy/integration/mappers";
import type { Product } from "src/olffy/types";

// Búsqueda global del storefront. Corre solo en servidor: el cliente nunca
// habla con Shopify directamente ni recibe tokens. El catálogo viene del
// caché de getProducts (tag `products`), así cada consulta no golpea a
// Shopify.

export interface StorefrontSearchResponse {
  query: string;
  results: SearchResultDto[];
}

function toSearchResult(product: Product): SearchResultDto {
  return {
    handle: product.handle,
    name: product.name,
    cat: product.cat,
    price: product.price,
    ...(product.image ? { image: product.image } : {}),
    availableForSale: product.availableForSale,
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<StorefrontSearchResponse>> {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  // Consultas vacías/cortas no ejecutan búsqueda (mismo criterio que la UI).
  if (!isSearchableQuery(query)) {
    return NextResponse.json({ query, results: [] });
  }

  const products = toOlffyProducts(
    await getProducts({ sortKey: "CREATED_AT", reverse: true }),
  );

  return NextResponse.json({
    query,
    results: rankProducts(products, query, MAX_RESULTS).map(toSearchResult),
  });
}
