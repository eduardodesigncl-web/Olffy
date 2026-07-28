import { describe, expect, it } from "vitest";
import { allocateSaleLineDiscounts } from "./sale-lines";

describe("allocateSaleLineDiscounts", () => {
  it("keeps line totals consistent with subtotal, discount and sale total", () => {
    const lines = allocateSaleLineDiscounts(
      [
        { id: "a", grossTotal: 10_000 },
        { id: "b", grossTotal: 5_000 },
      ],
      3_000,
    );

    expect(lines.map((line) => line.allocatedDiscount)).toEqual([2_000, 1_000]);
    expect(lines.reduce((sum, line) => sum + line.grossTotal, 0)).toBe(15_000);
    expect(lines.reduce((sum, line) => sum + line.allocatedDiscount, 0)).toBe(
      3_000,
    );
    expect(lines.reduce((sum, line) => sum + line.paidTotal, 0)).toBe(12_000);
  });

  it("assigns rounding remainder to the final line without exceeding it", () => {
    const lines = allocateSaleLineDiscounts(
      [
        { id: "a", grossTotal: 333 },
        { id: "b", grossTotal: 667 },
      ],
      101,
    );

    expect(lines.reduce((sum, line) => sum + line.allocatedDiscount, 0)).toBe(
      101,
    );
    expect(lines.every((line) => line.paidTotal >= 0)).toBe(true);
  });
});
