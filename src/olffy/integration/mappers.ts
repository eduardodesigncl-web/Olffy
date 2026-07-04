// Mapea los datos de Shopify (Storefront API) a los tipos del frontend
// oficial OLFFY (src/olffy/types). Es la única capa que conoce ambos lados.
import type {
  Cart as ShopifyCart,
  CartItem as ShopifyCartLine,
  Collection as ShopifyCollection,
  Product as ShopifyProduct,
} from "lib/shopify/types";
import type { CartItem, Product, ProductTag } from "../types";

// Paleta de fondos suaves para productos sin imagen (mismos tonos del mock).
const BG_PALETTE = ["#F2E0CC", "#FFE9A8", "#DEDDF2", "#FBD4C2", "#FFF1CE"];

// Tags "de sistema" que se usan para badge/categoría y no se muestran como categoría.
const SYSTEM_TAGS = ["new", "nuevo", "favorito", "especial", "regalo"];

export function formatClp(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function money(value: string | number | undefined | null): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

// El CDN de Shopify redimensiona vía query param: pedir el tamaño justo
// evita descargar originales de varios MB para cards de ~400px.
function sizedImage(
  url: string | undefined,
  width: number,
): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("cdn.shopify.com")) return url;
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

function bgFromHandle(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return BG_PALETTE[hash % BG_PALETTE.length]!;
}

function primaryVariant(product: ShopifyProduct) {
  return (
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0]
  );
}

function totalInventory(product: ShopifyProduct): number | null {
  const quantities = product.variants
    .map((variant) => variant.quantityAvailable)
    .filter((value): value is number => typeof value === "number");

  if (!quantities.length) return null;

  return quantities.reduce((sum, value) => sum + value, 0);
}

function categoryFromTags(product: ShopifyProduct): string {
  const visibleTag = product.tags.find(
    (tag) => !SYSTEM_TAGS.includes(tag.toLowerCase()),
  );

  return visibleTag ?? "Papelería";
}

function badgeFromTags(
  product: ShopifyProduct,
  quantityAvailable: number | null,
): ProductTag {
  if (!product.availableForSale || quantityAvailable === 0) return "Agotado";

  const normalized = product.tags.map((tag) => tag.toLowerCase());
  if (normalized.includes("favorito")) return "Favorito";
  if (normalized.includes("especial")) return "Especial";
  if (normalized.includes("nuevo") || normalized.includes("new")) {
    return "Nuevo";
  }

  return "";
}

function specsFromOptions(product: ShopifyProduct) {
  return product.options
    .filter((option) => option.values.length > 0)
    .filter((option) => option.name.toLowerCase() !== "title")
    .slice(0, 4)
    .map((option) => ({
      l: option.name.toUpperCase(),
      v: option.values.join(" / "),
    }));
}

export function toOlffyProduct(product: ShopifyProduct): Product {
  const variant = primaryVariant(product);
  const quantityAvailable = totalInventory(product);
  const image = product.featuredImage?.url ?? product.images[0]?.url;
  const price =
    money(variant?.price.amount) ||
    money(product.priceRange.minVariantPrice.amount);

  return {
    id: product.id,
    handle: product.handle,
    name: product.title,
    cat: categoryFromTags(product),
    price: formatClp(price),
    n: price,
    tag: badgeFromTags(product, quantityAvailable),
    bg: bgFromHandle(product.handle),
    image: sizedImage(image, 720),
    colors: [],
    specs: specsFromOptions(product),
    bundle: null,
    desc: product.description,
    variantId: variant?.id ?? "",
    availableForSale: product.availableForSale && quantityAvailable !== 0,
  };
}

export function toOlffyProducts(products: ShopifyProduct[]): Product[] {
  return products.map(toOlffyProduct).filter((product) => product.variantId);
}

// Categorías visibles para los chips de la tienda: 'Todos' + categorías
// reales presentes en el catálogo, en orden alfabético.
export function toOlffyCategories(products: Product[]): string[] {
  const unique = [...new Set(products.map((product) => product.cat))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  return ["Todos", ...unique];
}

function toOlffyCartItem(line: ShopifyCartLine): CartItem {
  const product = line.merchandise.product;
  const lineTotal = money(line.cost.totalAmount.amount);
  const unitPrice = line.quantity > 0 ? lineTotal / line.quantity : lineTotal;
  const variantTitle =
    line.merchandise.title && line.merchandise.title !== "Default Title"
      ? line.merchandise.title
      : "OLFFY";

  return {
    id: product.id,
    handle: product.handle,
    name: product.title,
    cat: variantTitle,
    price: formatClp(unitPrice),
    n: unitPrice,
    tag: "",
    bg: bgFromHandle(product.handle),
    image: sizedImage(product.featuredImage?.url, 360),
    colors: [],
    specs: [],
    bundle: null,
    desc: "",
    variantId: line.merchandise.id,
    availableForSale: true,
    qty: line.quantity,
    lineId: line.id ?? line.merchandise.id,
  };
}

export function toOlffyCartItems(cart?: ShopifyCart): CartItem[] {
  return (cart?.lines ?? []).map(toOlffyCartItem);
}

export interface OlffyCollectionCard {
  title: string;
  description: string;
  bg: string;
  path: string;
}

export function toOlffyCollections(
  collections: ShopifyCollection[],
): OlffyCollectionCard[] {
  return collections
    .filter((collection) => collection.handle)
    .slice(0, 3)
    .map((collection, index) => ({
      title: collection.title,
      description: collection.description || "Colección OLFFY",
      bg: BG_PALETTE[index % BG_PALETTE.length]!,
      path: collection.path,
    }));
}
