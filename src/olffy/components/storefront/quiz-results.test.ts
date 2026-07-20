import { describe, expect, it } from "vitest";
import type { Product } from "../../types";
import { getQuizResults } from "./quiz-results";

function product(
  name: string,
  price: number,
  cat: string,
  extra: Partial<Product> = {},
): Product {
  return {
    id: name,
    handle: name.toLowerCase().replaceAll(" ", "-"),
    name,
    cat,
    price: `$${price}`,
    n: price,
    tag: "",
    bg: "#fff",
    colors: [],
    specs: [],
    bundle: null,
    desc: "",
    variantId: `variant-${name}`,
    availableForSale: true,
    quantityAvailable: null,
    ...extra,
  };
}

describe("getQuizResults", () => {
  it("respeta estrictamente el tramo de presupuesto elegido", () => {
    const catalog = [
      product("Sticker barato", 4000, "Stickers"),
      product("Planner medio", 12000, "Planners"),
      product("Cuaderno alto", 25000, "Cuadernos"),
      product("Kit premium", 38000, "Regalos"),
    ];

    expect(
      getQuizResults({ 4: "medio" }, catalog).map((item) => item.name),
    ).toEqual(["Planner medio"]);
    expect(
      getQuizResults({ 4: "premium" }, catalog).map((item) => item.name),
    ).toEqual(["Kit premium"]);
  });

  it("prioriza la actividad y el estilo sobre el orden del catálogo", () => {
    const catalog = [
      product("Tarjeta ilustrada", 9000, "Empaque"),
      product("Planner semanal", 11000, "Planners", {
        desc: "Agenda práctica con checklist y planificación mensual.",
      }),
      product("Libreta creativa", 10000, "Libretas"),
    ];

    const results = getQuizResults(
      { 2: "organizar", 3: "practico", 4: "medio" },
      catalog,
    );

    expect(results[0]?.name).toBe("Planner semanal");
  });

  it("usa la elección infantil y excluye productos agotados", () => {
    const catalog = [
      product("Tarjeta clásica", 4500, "Empaque"),
      product("Flashcards para niños", 4500, "FlashCards"),
      product("Stickers escolares agotados", 4500, "Stickers", {
        availableForSale: false,
      }),
    ];

    const results = getQuizResults({ 1: "hijos", 4: "bajo" }, catalog);

    expect(results[0]?.name).toBe("Flashcards para niños");
    expect(results).toHaveLength(2);
  });
});
