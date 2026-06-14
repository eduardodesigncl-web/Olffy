import { getProduct, getProducts } from "lib/shopify";
import type { Product } from "lib/shopify/types";
import { OlffyProduct, products as demoProducts } from "./data";

const fallbackImage =
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80";

function getPrimaryVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.availableForSale) ||
    product.variants[0]
  );
}

function getInventory(product: Product) {
  const knownQuantities = product.variants
    .map((variant) => variant.quantityAvailable)
    .filter((quantity): quantity is number => typeof quantity === "number");

  if (!knownQuantities.length) return null;

  return knownQuantities.reduce((total, quantity) => total + quantity, 0);
}

function getCategory(product: Product) {
  const visibleTag = product.tags.find(
    (tag) =>
      !["new", "nuevo", "favorito", "regalo"].includes(tag.toLowerCase()),
  );

  return visibleTag || "Papeleria";
}

function getBadge(product: Product, quantityAvailable: number | null) {
  if (!product.availableForSale || quantityAvailable === 0) return "Agotado";

  const normalizedTags = product.tags.map((tag) => tag.toLowerCase());
  if (normalizedTags.includes("favorito")) return "Favorito";
  if (normalizedTags.includes("regalo")) return "Regalo";
  if (normalizedTags.includes("nuevo") || normalizedTags.includes("new")) {
    return "Nuevo";
  }

  return "Disponible";
}

export function toOlffyProduct(product: Product): OlffyProduct {
  const primaryVariant = getPrimaryVariant(product);
  const quantityAvailable = getInventory(product);
  const price = Number(
    primaryVariant?.price.amount || product.priceRange.minVariantPrice.amount,
  );

  return {
    id: product.handle,
    handle: product.handle,
    name: product.title,
    price: Number.isFinite(price) ? price : 0,
    currencyCode:
      primaryVariant?.price.currencyCode ||
      product.priceRange.minVariantPrice.currencyCode,
    category: getCategory(product),
    tag: getBadge(product, quantityAvailable),
    image:
      product.featuredImage?.url || product.images[0]?.url || fallbackImage,
    description: product.description,
    availableForSale: product.availableForSale && quantityAvailable !== 0,
    quantityAvailable,
    variantId: primaryVariant?.id,
  };
}

export async function getOlffyProducts() {
  try {
    const shopifyProducts = await getProducts({
      sortKey: "CREATED_AT",
      reverse: true,
    });
    const mappedProducts = shopifyProducts.map(toOlffyProduct);

    if (mappedProducts.length) return mappedProducts;
  } catch (error) {
    console.error("Could not load Shopify products for Olffy MVP", error);
  }

  return demoProducts;
}

export async function getOlffyProduct(handle: string) {
  try {
    const shopifyProduct = await getProduct(handle);

    if (shopifyProduct) return toOlffyProduct(shopifyProduct);
  } catch (error) {
    console.error(`Could not load Shopify product "${handle}"`, error);
  }

  return demoProducts.find((product) => product.handle === handle);
}
