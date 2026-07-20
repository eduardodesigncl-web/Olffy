// Mapea los datos de Shopify (Storefront API) a los tipos del frontend
// oficial OLFFY (src/olffy/types). Es la única capa que conoce ambos lados.
import type {
  Cart as ShopifyCart,
  CartItem as ShopifyCartLine,
  Collection as ShopifyCollection,
  Product as ShopifyProduct,
  ProductVariant as ShopifyProductVariant,
} from "lib/shopify/types";
import type {
  CartItem,
  Product,
  ProductTag,
  ProductVariantSummary,
} from "../types";

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

// Stock de UNA variante. La suma del inventario de todas las variantes nunca
// se usa para decidir si una variante específica puede comprarse: el número
// visible, el máximo del stepper y la validación del carrito deben referirse
// a la misma variante que se agrega (merchandiseId).
function variantQuantityAvailable(
  variant: ShopifyProductVariant | undefined,
): number | null {
  return typeof variant?.quantityAvailable === "number"
    ? variant.quantityAvailable
    : null;
}

function toVariantSummary(
  variant: ShopifyProductVariant,
): ProductVariantSummary {
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    quantityAvailable: variantQuantityAvailable(variant),
    price: money(variant.price.amount),
    selectedOptions: variant.selectedOptions,
  };
}

// Un producto "sin opciones" en Shopify tiene una sola opción "Title" con el
// valor "Default Title"; en ese caso no hay selección real de variante.
function hasRealOptions(product: ShopifyProduct): boolean {
  return product.options.some(
    (option) => option.name.toLowerCase() !== "title",
  );
}

// Colecciones que funcionan como marcadores (badge/portada), no como
// categoría de catálogo.
function isMarkerCollection(handle: string, title: string): boolean {
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  return (
    h.startsWith("novedades") ||
    t.startsWith("novedades") ||
    h === "frontpage" ||
    h === "all" ||
    h === "destacados"
  );
}

// La categoría del producto viene de sus colecciones Shopify (Cuadernos,
// Libretas, Stickers, Tacos de Notas, etc.); los tags quedan como respaldo.
function categoryFor(product: ShopifyProduct): string {
  const collection = product.collections.find(
    (c) => !isMarkerCollection(c.handle, c.title),
  );
  if (collection) return collection.title.replace(/!+$/, "").trim();

  const visibleTag = product.tags.find(
    (tag) => !SYSTEM_TAGS.includes(tag.toLowerCase()),
  );
  return visibleTag ?? "Papelería";
}

function badgeFor(
  product: ShopifyProduct,
  quantityAvailable: number | null,
): ProductTag {
  if (!product.availableForSale || quantityAvailable === 0) return "Agotado";

  // La colección "Novedades!" marca los productos nuevos de la tienda.
  if (
    product.collections.some(
      (c) =>
        isMarkerCollection(c.handle, c.title) &&
        c.title.toLowerCase().startsWith("novedades"),
    )
  ) {
    return "Nuevo";
  }

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

// ── Parsing de la descripción (Shopify descriptionHtml) ────────────────────
// Las descripciones OLFFY traen párrafos editoriales y, al final, una lista
// "Detalles del producto" con líneas "Etiqueta: valor". Se separan en:
// intro (desc corta bajo el precio), specs (grilla) y texto extendido para
// enriquecer la categorización y los contenidos relacionados.

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function htmlToLines(html: string): string[] {
  const text = html
    .replace(/<br[^>]*>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? " ");

  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// Etiquetas de specs priorizadas para la grilla del detalle.
const SPEC_PRIORITY = [
  "tamaño",
  "cantidad",
  "hojas",
  "gramaje",
  "formato",
  "interior",
  "terminación",
  "terminacion",
  "material",
  "diseño",
  "adhesivo",
  "uso",
];

const SPEC_LABEL_RE =
  /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ /()-]{1,24}):\s*(.{2,80})$/;
const NON_SPEC_LABELS = new Set([
  "descripción",
  "descripcion",
  "detalles del producto",
  "contiene",
  "incluye",
  "nota",
]);

export interface ParsedDescription {
  intro: string;
  specs: { l: string; v: string }[];
  full: string;
}

export function parseProductDescription(
  html: string,
  fallback: string,
): ParsedDescription {
  const lines = html ? htmlToLines(html) : [];

  if (!lines.length) {
    return { intro: fallback, specs: [], full: fallback };
  }

  const specs: { l: string; v: string }[] = [];
  const seenLabels = new Set<string>();
  const proseLines: string[] = [];

  for (const line of lines) {
    const match = SPEC_LABEL_RE.exec(line);
    if (match) {
      const label = match[1]!.trim();
      const key = label.toLowerCase();
      if (!NON_SPEC_LABELS.has(key) && !seenLabels.has(key)) {
        seenLabels.add(key);
        specs.push({ l: label.toUpperCase(), v: match[2]!.trim() });
        continue;
      }
      if (NON_SPEC_LABELS.has(key)) continue;
    }
    // Encabezados de sección tipo "Detalles del producto:" no van a la prosa.
    if (
      /^detalles del producto:?$/i.test(line) ||
      /^descripción$/i.test(line)
    ) {
      continue;
    }
    proseLines.push(line);
  }

  // Intro: primeros párrafos editoriales (sin listas "- ..."), acotada.
  const introParts: string[] = [];
  for (const line of proseLines) {
    if (line.startsWith("- ")) break;
    introParts.push(line);
    if (introParts.join(" ").length > 260) break;
  }
  const intro = introParts.join(" ").trim() || fallback;

  // Specs ordenadas por prioridad (Tamaño, Cantidad, Gramaje, Formato…).
  const orderedSpecs = [...specs].sort((a, b) => {
    const pa = SPEC_PRIORITY.indexOf(a.l.toLowerCase());
    const pb = SPEC_PRIORITY.indexOf(b.l.toLowerCase());
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });

  return {
    intro,
    specs: orderedSpecs.slice(0, 4),
    full: proseLines.join("\n") || fallback,
  };
}

export function toOlffyProduct(product: ShopifyProduct): Product {
  const variant = primaryVariant(product);
  // Fuente de verdad: la variante que se agrega al carrito, no el producto.
  const quantityAvailable = variantQuantityAvailable(variant);
  const image = product.featuredImage?.url ?? product.images[0]?.url;
  const gallery = product.images
    .map((img) => sizedImage(img.url, 960))
    .filter((url): url is string => Boolean(url));
  const hoverImage = product.images[1]?.url;
  const price =
    money(variant?.price.amount) ||
    money(product.priceRange.minVariantPrice.amount);
  const parsed = parseProductDescription(
    product.descriptionHtml,
    product.description,
  );
  const optionSpecs = specsFromOptions(product);

  return {
    id: product.id,
    handle: product.handle,
    name: product.title,
    cat: categoryFor(product),
    price: formatClp(price),
    n: price,
    tag: badgeFor(product, quantityAvailable),
    bg: bgFromHandle(product.handle),
    image: sizedImage(image, 720),
    hoverImage: sizedImage(hoverImage, 720),
    images: gallery.length ? gallery : undefined,
    colors: [],
    specs: [...parsed.specs, ...optionSpecs].slice(0, 4),
    bundle: null,
    desc: parsed.intro,
    fullDesc: parsed.full,
    tags: product.tags,
    variantId: variant?.id ?? "",
    availableForSale:
      product.availableForSale &&
      (variant?.availableForSale ?? false) &&
      quantityAvailable !== 0,
    quantityAvailable,
    ...(hasRealOptions(product)
      ? { variants: product.variants.map(toVariantSummary) }
      : {}),
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
  // Disponibilidad real de la línea: viene de la variante (merchandise) que
  // está en el carrito, no se infiere ni se hardcodea.
  const quantityAvailable =
    typeof line.merchandise.quantityAvailable === "number"
      ? line.merchandise.quantityAvailable
      : null;

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
    availableForSale: line.merchandise.availableForSale,
    quantityAvailable,
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
