import type { Product } from "../../types";

const MAX_RESULTS = 8;

type AnswerProfile = Record<string, readonly string[]>;

// La primera respuesta tiene un peso suave: evita estereotipos de género y
// solo especializa casos con una intención clara (niños o fans de papelería).
const RECIPIENT_KEYWORDS: AnswerProfile = {
  ella: ["regalo", "detalle", "tarjeta", "kit"],
  el: ["regalo", "detalle", "tarjeta", "kit"],
  amiga: ["regalo", "detalle", "tarjeta", "kit"],
  amigo: ["regalo", "detalle", "tarjeta", "kit"],
  hijos: ["infantil", "niño", "escolar", "flashcard", "colorear", "sticker"],
  papeleria: [
    "papeleria",
    "cuaderno",
    "libreta",
    "planner",
    "sticker",
    "notas",
  ],
};

const ACTIVITY_KEYWORDS: AnswerProfile = {
  escribir: [
    "cuaderno",
    "libreta",
    "notas",
    "taquito",
    "taco",
    "lapiz",
    "escribir",
  ],
  organizar: [
    "planner",
    "agenda",
    "calendario",
    "checklist",
    "semanal",
    "mensual",
    "organizar",
  ],
  decorar: ["sticker", "washi", "decorar", "adhesivo", "marcapagina"],
  scrapbooking: ["scrap", "sticker", "papel", "troquel", "adhesivo", "cinta"],
  crear: [
    "dibujo",
    "dibujar",
    "colorear",
    "cuaderno",
    "libreta",
    "lapiz",
    "crear",
  ],
  regalo: ["regalo", "kit", "caja", "tarjeta", "empaque", "set"],
};

const STYLE_KEYWORDS: AnswerProfile = {
  colorido: ["colorido", "alegre", "colores", "flor", "ilustrado"],
  cute: ["tierno", "cute", "animal", "gato", "raton", "pinguino", "corazon"],
  artistico: [
    "artistico",
    "ilustrado",
    "ilustracion",
    "naturaleza",
    "fauna",
    "dibujo",
  ],
  practico: [
    "planner",
    "agenda",
    "notas",
    "checklist",
    "calendario",
    "organizar",
  ],
  coleccionable: [
    "coleccion",
    "edicion",
    "sticker",
    "marcapagina",
    "flashcard",
  ],
  sorpresa: ["sorpresa", "kit", "caja", "regalo", "mix", "set"],
};

const BUDGET_LABELS: Record<string, string> = {
  bajo: "hasta $5.000",
  medio: "entre $5.000 y $15.000",
  alto: "entre $15.000 y $30.000",
  premium: "sobre $30.000",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function productContext(product: Product): string {
  return normalize(
    [
      product.name,
      product.cat,
      product.desc,
      product.fullDesc ?? "",
      ...(product.tags ?? []),
      ...product.specs.flatMap((spec) => [spec.l, spec.v]),
    ].join(" "),
  );
}

function matchesBudget(price: number, budget: string | undefined): boolean {
  if (budget === "bajo") return price <= 5000;
  if (budget === "medio") return price > 5000 && price <= 15000;
  if (budget === "alto") return price > 15000 && price <= 30000;
  if (budget === "premium") return price > 30000;
  return true;
}

function priceTarget(budget: string | undefined): number {
  if (budget === "bajo") return 5000;
  if (budget === "medio") return 10000;
  if (budget === "alto") return 22500;
  if (budget === "premium") return 35000;
  return 0;
}

function keywordScore(
  context: string,
  answer: string | undefined,
  profiles: AnswerProfile,
  weight: number,
): number {
  if (!answer) return 0;
  return (profiles[answer] ?? []).reduce(
    (score, keyword) => score + (context.includes(keyword) ? weight : 0),
    0,
  );
}

export function quizBudgetLabel(budget: string | undefined): string | null {
  return budget ? (BUDGET_LABELS[budget] ?? null) : null;
}

// El presupuesto es un filtro estricto; las otras tres respuestas puntúan el
// contenido real de Shopify (colección, título, descripción, tags y specs).
// Así nunca se completan resultados con productos fuera del rango elegido.
export function getQuizResults(
  answers: Record<number, string>,
  products: Product[],
  maxResults = MAX_RESULTS,
): Product[] {
  const recipient = answers[1];
  const activity = answers[2];
  const style = answers[3];
  const budget = answers[4];
  const target = priceTarget(budget);

  return products
    .filter(
      (product) =>
        product.availableForSale &&
        product.n > 0 &&
        matchesBudget(product.n, budget),
    )
    .map((product, index) => {
      const context = productContext(product);
      const score =
        keywordScore(context, recipient, RECIPIENT_KEYWORDS, 2) +
        keywordScore(context, activity, ACTIVITY_KEYWORDS, 6) +
        keywordScore(context, style, STYLE_KEYWORDS, 4);

      return {
        product,
        score,
        priceDistance: target ? Math.abs(product.n - target) : 0,
        index,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.priceDistance - b.priceDistance ||
        a.index - b.index,
    )
    .slice(0, Math.max(0, maxResults))
    .map(({ product }) => product);
}
