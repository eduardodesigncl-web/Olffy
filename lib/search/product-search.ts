// Búsqueda de catálogo OLFFY: normalización y ranking deterministas, sin
// React ni dependencias de Next, para poder testearlos de forma aislada.
// El ranking corre en el servidor sobre el catálogo cacheado (getProducts),
// lo que da tolerancia a tildes/typos que la sintaxis de búsqueda de Shopify
// no ofrece.

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const MAX_RESULTS = 8;

// Campos mínimos que necesita el ranking; `Product` de src/olffy/types los
// cumple, pero mantener la interfaz chica evita acoplar esta utilidad al
// contrato completo del frontend.
export interface SearchableProduct {
  handle: string;
  name: string;
  cat: string;
  desc?: string;
  tags?: string[];
}

// DTO mínimo que devuelve /api/storefront/search: lo justo para pintar un
// resultado (imagen, nombre, categoría, precio y disponibilidad). Nunca
// descripciones completas ni datos internos.
export interface SearchResultDto {
  handle: string;
  name: string;
  cat: string;
  price: string;
  image?: string;
  availableForSale: boolean;
  quantityAvailable?: number | null;
}

// Minúsculas, sin tildes (ñ se pliega a n para que "diseno" encuentre
// "diseño" y viceversa), puntuación → espacio, espacios colapsados.
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSearchableQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return (
    normalized.length >= MIN_QUERY_LENGTH &&
    normalized.length <= MAX_QUERY_LENGTH
  );
}

// Distancia de edición acotada: retorna Infinity apenas supera `max`, así el
// costo por token queda constante para el tamaño de catálogo actual.
export function boundedEditDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return Infinity;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      const value = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        substitution,
      );
      current.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return Infinity;
    previous = current;
  }

  return previous[b.length]! <= max ? previous[b.length]! : Infinity;
}

// Puntajes por tipo de coincidencia (ver plan QA). Un producto suma cada
// tier que cumple; como "exacto" implica "comienza con" e "incluye", la
// suma conserva el orden esperado entre tiers.
const SCORE_TITLE_EXACT = 100;
const SCORE_TITLE_STARTS_WITH = 80;
const SCORE_TITLE_CONTAINS = 60;
const SCORE_CATEGORY_OR_TAG = 40;
const SCORE_DESCRIPTION = 20;
const SCORE_FUZZY_TITLE = 15;
const SCORE_FUZZY_SECONDARY = 10;

function fuzzyTokenMatch(
  queryTokens: string[],
  fieldTokens: string[],
): boolean {
  return queryTokens.some((queryToken) => {
    if (queryToken.length < 4) return false;
    return fieldTokens.some(
      (fieldToken) =>
        boundedEditDistance(queryToken, fieldToken, 2) !== Infinity,
    );
  });
}

export function scoreProduct(
  product: SearchableProduct,
  rawQuery: string,
): number {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 0;

  const title = normalizeSearchText(product.name);
  const category = normalizeSearchText(product.cat);
  const tags = (product.tags ?? []).map(normalizeSearchText);
  const description = normalizeSearchText(product.desc ?? "");

  let score = 0;
  if (title === query) score += SCORE_TITLE_EXACT;
  if (title.startsWith(query)) score += SCORE_TITLE_STARTS_WITH;
  if (title.includes(query)) score += SCORE_TITLE_CONTAINS;
  if (category.includes(query) || tags.some((tag) => tag.includes(query))) {
    score += SCORE_CATEGORY_OR_TAG;
  }
  if (description.includes(query)) score += SCORE_DESCRIPTION;

  // Tolerancia a typos solo cuando no hubo coincidencia literal en el campo.
  const queryTokens = query.split(" ");
  if (
    !title.includes(query) &&
    fuzzyTokenMatch(queryTokens, title.split(" "))
  ) {
    score += SCORE_FUZZY_TITLE;
  }
  const secondaryTokens = [
    ...category.split(" "),
    ...tags.flatMap((tag) => tag.split(" ")),
  ];
  if (
    score < SCORE_CATEGORY_OR_TAG &&
    fuzzyTokenMatch(queryTokens, secondaryTokens)
  ) {
    score += SCORE_FUZZY_SECONDARY;
  }

  return score;
}

// Orden determinista: puntaje descendente y, a igual puntaje, orden
// alfabético por nombre para que la misma consulta dé siempre el mismo
// resultado.
export function rankProducts<T extends SearchableProduct>(
  products: T[],
  query: string,
  limit: number = MAX_RESULTS,
): T[] {
  if (!isSearchableQuery(query)) return [];

  return products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.product.name.localeCompare(b.product.name, "es"),
    )
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.product);
}
