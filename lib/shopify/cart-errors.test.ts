import { describe, expect, it } from "vitest";
import { cartErrorMessage, interpretCartUserErrors } from "./cart-errors";

const userError = (message: string, code: string | null = null) => ({
  field: null,
  message,
  code,
});

describe("interpretCartUserErrors", () => {
  it("devuelve null sin errores", () => {
    expect(interpretCartUserErrors([])).toBeNull();
    expect(interpretCartUserErrors(undefined)).toBeNull();
  });

  it("clasifica agotado por código o mensaje", () => {
    expect(
      interpretCartUserErrors([userError("x", "MERCHANDISE_OUT_OF_STOCK")]),
    ).toMatchObject({ code: "OUT_OF_STOCK" });
    expect(
      interpretCartUserErrors([userError("The product is sold out")]),
    ).toMatchObject({ code: "OUT_OF_STOCK" });
  });

  it("clasifica variante no disponible", () => {
    expect(
      interpretCartUserErrors([userError("x", "INVALID_MERCHANDISE_LINE")]),
    ).toMatchObject({ code: "NOT_AVAILABLE" });
    expect(
      interpretCartUserErrors([
        userError("This variant is no longer available"),
      ]),
    ).toMatchObject({ code: "NOT_AVAILABLE" });
  });

  it("clasifica stock insuficiente por mensaje de cantidad", () => {
    expect(
      interpretCartUserErrors([
        userError("You can only add 3 to the cart based on quantity limits"),
      ]),
    ).toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });

  it("cae a SHOPIFY_ERROR sin exponer el mensaje crudo", () => {
    const result = interpretCartUserErrors([
      userError("Internal weird failure XYZ-42"),
    ]);
    expect(result).toMatchObject({ code: "SHOPIFY_ERROR" });
    expect(result!.message).not.toContain("XYZ-42");
  });
});

describe("cartErrorMessage", () => {
  it("incluye la cantidad disponible en stock insuficiente", () => {
    expect(cartErrorMessage("INSUFFICIENT_STOCK", 2)).toBe(
      "Solo quedan 2 unidades. Ajustamos la cantidad disponible.",
    );
    expect(cartErrorMessage("INSUFFICIENT_STOCK", 1)).toBe(
      "Solo queda 1 unidad. Ajustamos la cantidad disponible.",
    );
  });

  it("tiene mensajes legibles para cada código", () => {
    expect(cartErrorMessage("OUT_OF_STOCK")).toMatch(/agotó/);
    expect(cartErrorMessage("NOT_AVAILABLE")).toMatch(/no está disponible/);
    expect(cartErrorMessage("SHOPIFY_ERROR")).toMatch(/Intenta nuevamente/);
  });
});
