import { describe, expect, it } from "vitest";
import {
  boundedEditDistance,
  isSearchableQuery,
  normalizeSearchText,
  rankProducts,
  scoreProduct,
} from "./product-search";

const product = (
  name: string,
  overrides: Partial<{
    handle: string;
    cat: string;
    desc: string;
    tags: string[];
  }> = {},
) => ({
  handle: overrides.handle ?? name.toLowerCase().replace(/\s+/g, "-"),
  name,
  cat: overrides.cat ?? "Papelería",
  desc: overrides.desc ?? "",
  tags: overrides.tags ?? [],
});

describe("normalizeSearchText", () => {
  it("lowercases, strips accents and collapses whitespace", () => {
    expect(normalizeSearchText("  Cuadérno   PUNTOS ")).toBe("cuaderno puntos");
    expect(normalizeSearchText("Papelería")).toBe("papeleria");
  });

  it("replaces punctuation with spaces and folds ñ to n", () => {
    expect(normalizeSearchText("planner: semanal/mensual!")).toBe(
      "planner semanal mensual",
    );
    expect(normalizeSearchText("Diseño")).toBe("diseno");
  });
});

describe("isSearchableQuery", () => {
  it("rejects empty and single-character queries", () => {
    expect(isSearchableQuery("")).toBe(false);
    expect(isSearchableQuery(" a ")).toBe(false);
    expect(isSearchableQuery("!!")).toBe(false);
  });

  it("accepts two or more normalized characters", () => {
    expect(isSearchableQuery("ab")).toBe(true);
    expect(isSearchableQuery("cuaderno")).toBe(true);
  });

  it("rejects queries beyond the maximum length", () => {
    expect(isSearchableQuery("x".repeat(200))).toBe(false);
  });
});

describe("boundedEditDistance", () => {
  it("computes small distances", () => {
    expect(boundedEditDistance("planner", "planner", 2)).toBe(0);
    expect(boundedEditDistance("planer", "planner", 2)).toBe(1);
    expect(boundedEditDistance("planr", "planner", 2)).toBe(2);
  });

  it("returns Infinity beyond the cap", () => {
    expect(boundedEditDistance("plan", "cuaderno", 2)).toBe(Infinity);
    expect(boundedEditDistance("ab", "abcdef", 2)).toBe(Infinity);
  });
});

describe("scoreProduct", () => {
  it("ranks exact title above prefix and substring matches", () => {
    const exact = scoreProduct(product("Planner Semanal"), "planner semanal");
    const prefix = scoreProduct(
      product("Planner Semanal A5"),
      "planner semanal",
    );
    const contains = scoreProduct(
      product("Mi Planner Semanal"),
      "planner semanal",
    );
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(contains);
    expect(contains).toBeGreaterThan(0);
  });

  it("matches category, tags and description with lower scores", () => {
    const byCategory = scoreProduct(
      product("Luna", { cat: "Stickers" }),
      "stickers",
    );
    const byDescription = scoreProduct(
      product("Luna", { desc: "láminas de stickers ilustrados" }),
      "stickers",
    );
    expect(byCategory).toBeGreaterThan(byDescription);
    expect(byDescription).toBeGreaterThan(0);
  });

  it("is accent-insensitive in both directions", () => {
    expect(
      scoreProduct(product("Cuaderno Ilustración"), "ilustracion"),
    ).toBeGreaterThan(0);
    expect(scoreProduct(product("Papeleria"), "papelería")).toBeGreaterThan(0);
  });

  it("tolerates typos with edit distance up to 2", () => {
    expect(
      scoreProduct(product("Cuaderno Puntos"), "cuadreno"),
    ).toBeGreaterThan(0);
    expect(scoreProduct(product("Cuaderno Puntos"), "xyzw")).toBe(0);
  });

  it("ignores short tokens for fuzzy matching", () => {
    // "sal" está a distancia 1 de "sol", pero con menos de 4 caracteres el
    // fuzzy no aplica y no hay coincidencia literal.
    expect(scoreProduct(product("Sol"), "sal")).toBe(0);
  });
});

describe("rankProducts", () => {
  const catalog = [
    product("Cuaderno Puntos", { cat: "Cuadernos" }),
    product("Planner Semanal", { cat: "Planners" }),
    product("Stickers Gatitos", { cat: "Stickers", tags: ["nuevo"] }),
    product("Taco de Notas", {
      cat: "Tacos de Notas",
      desc: "Notas adhesivas con planner de escritorio",
    }),
  ];

  it("returns empty for non-searchable queries", () => {
    expect(rankProducts(catalog, "")).toEqual([]);
    expect(rankProducts(catalog, "a")).toEqual([]);
  });

  it("orders by score with title matches first", () => {
    const results = rankProducts(catalog, "planner");
    expect(results.map((p) => p.name)).toEqual([
      "Planner Semanal",
      "Taco de Notas",
    ]);
  });

  it("excludes products without any match", () => {
    const results = rankProducts(catalog, "gatitos");
    expect(results.map((p) => p.name)).toEqual(["Stickers Gatitos"]);
  });

  it("limits the number of results deterministically", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      product(`Cuaderno ${String.fromCharCode(65 + i)}`),
    );
    const results = rankProducts(many, "cuaderno", 6);
    expect(results).toHaveLength(6);
    expect(results[0]!.name).toBe("Cuaderno A");
  });

  it("breaks score ties alphabetically for stable output", () => {
    const tied = [product("Cuaderno Zorro"), product("Cuaderno Ardilla")];
    const results = rankProducts(tied, "cuaderno");
    expect(results.map((p) => p.name)).toEqual([
      "Cuaderno Ardilla",
      "Cuaderno Zorro",
    ]);
  });
});
