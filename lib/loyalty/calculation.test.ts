import { describe, expect, it } from "vitest";
import {
  allocateDiscountProportionally,
  calculateLoyaltySnapshot,
  calculatePointsToKeepAfterRefund,
} from "./calculation";

const rule = {
  id: 1,
  name: "$200 = 1 punto",
  spendingUnitClp: 200,
  pointsPerUnit: 1,
};

describe("loyalty calculation", () => {
  it("distribuye descuentos globales sin perder pesos", () => {
    expect(allocateDiscountProportionally([10_000, 5_000], 1_001)).toEqual([
      667, 334,
    ]);
  });

  it("solo acumula sobre líneas elegibles después del descuento", () => {
    const result = calculateLoyaltySnapshot({
      lines: [
        { grossTotal: 10_000, eligible: true },
        {
          grossTotal: 5_000,
          eligible: false,
          exclusionReason: "product_metafield_excluded",
        },
      ],
      discount: 0,
      rule,
    });

    expect(result.eligibleTotal).toBe(10_000);
    expect(result.excludedTotal).toBe(5_000);
    expect(result.pointsEarned).toBe(50);
  });

  it("un carrito compuesto solo por excluidos genera cero puntos", () => {
    const result = calculateLoyaltySnapshot({
      lines: [{ grossTotal: 5_000, eligible: false }],
      discount: 500,
      rule,
    });

    expect(result.eligibleTotal).toBe(0);
    expect(result.excludedTotal).toBe(4_500);
    expect(result.pointsEarned).toBe(0);
  });

  it("respeta una nueva versión de la regla sin alterar el snapshot anterior", () => {
    const oldSale = calculateLoyaltySnapshot({
      lines: [{ grossTotal: 10_000, eligible: true }],
      discount: 0,
      rule,
    });
    const newSale = calculateLoyaltySnapshot({
      lines: [{ grossTotal: 10_000, eligible: true }],
      discount: 0,
      rule: { ...rule, id: 2, spendingUnitClp: 500, pointsPerUnit: 2 },
    });

    expect(oldSale.pointsEarned).toBe(50);
    expect(newSale.pointsEarned).toBe(40);
    expect(oldSale.pointsEarned).toBe(50);
  });

  it("acumula devoluciones pequeñas antes de decidir la reversa", () => {
    expect(
      calculatePointsToKeepAfterRefund({
        originalEligibleTotal: 399,
        cumulativeEligibleRefund: 100,
        rule,
      }),
    ).toBe(1);
    expect(
      calculatePointsToKeepAfterRefund({
        originalEligibleTotal: 399,
        cumulativeEligibleRefund: 200,
        rule,
      }),
    ).toBe(0);
  });
});
