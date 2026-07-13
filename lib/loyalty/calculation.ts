export const LOYALTY_CALCULATION_VERSION = "olffy-loyalty-v2";

export type LoyaltyRuleSnapshot = {
  id: number;
  name: string;
  spendingUnitClp: number;
  pointsPerUnit: number;
};

export type LoyaltyLineInput = {
  grossTotal: number;
  eligible: boolean;
  exclusionReason?: string;
};

export type LoyaltyLineCalculation = Omit<
  LoyaltyLineInput,
  "exclusionReason"
> & {
  allocatedDiscount: number;
  paidTotal: number;
  eligibleAmount: number;
  exclusionReason: string | null;
};

export type LoyaltyCalculation = {
  lines: LoyaltyLineCalculation[];
  grossTotal: number;
  discountTotal: number;
  paidProductsTotal: number;
  eligibleTotal: number;
  excludedTotal: number;
  pointsEarned: number;
  calculationVersion: typeof LOYALTY_CALCULATION_VERSION;
};

function clpInteger(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} debe ser un monto CLP no negativo`);
  }

  return Math.round(value);
}

/**
 * Distribuye un descuento en CLP con el método de mayores restos. La suma de
 * las asignaciones siempre coincide exactamente con el descuento informado.
 */
export function allocateDiscountProportionally(
  amounts: number[],
  discount: number,
): number[] {
  const normalized = amounts.map((amount) => clpInteger(amount, "La línea"));
  const total = normalized.reduce((sum, amount) => sum + amount, 0);
  const normalizedDiscount = clpInteger(discount, "El descuento");

  if (normalizedDiscount > total) {
    throw new Error("El descuento no puede superar el total de las líneas");
  }
  if (total === 0 || normalizedDiscount === 0) {
    return normalized.map(() => 0);
  }

  const exact = normalized.map(
    (amount) => (normalizedDiscount * amount) / total,
  );
  const allocated = exact.map(Math.floor);
  let remaining =
    normalizedDiscount - allocated.reduce((sum, amount) => sum + amount, 0);
  const priority = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let index = 0; index < remaining; index += 1) {
    const target = priority[index % priority.length];
    if (target) allocated[target.index] = (allocated[target.index] ?? 0) + 1;
  }

  return allocated;
}

export function calculateLoyaltySnapshot(input: {
  lines: LoyaltyLineInput[];
  discount: number;
  rule: LoyaltyRuleSnapshot;
  /** Los canjes de puntos se aplican solamente a productos elegibles. */
  discountEligibleOnly?: boolean;
}): LoyaltyCalculation {
  const grossTotals = input.lines.map((line) =>
    clpInteger(line.grossTotal, "El total bruto de la línea"),
  );
  const discountWeights = input.discountEligibleOnly
    ? grossTotals.map((amount, index) =>
        input.lines[index]?.eligible ? amount : 0,
      )
    : grossTotals;
  const allocated = allocateDiscountProportionally(
    discountWeights,
    input.discount,
  );
  const lines = input.lines.map((line, index): LoyaltyLineCalculation => {
    const grossTotal = grossTotals[index] ?? 0;
    const allocatedDiscount = allocated[index] ?? 0;
    const paidTotal = grossTotal - allocatedDiscount;
    const eligibleAmount = line.eligible ? paidTotal : 0;

    return {
      grossTotal,
      allocatedDiscount,
      paidTotal,
      eligible: line.eligible,
      eligibleAmount,
      exclusionReason: line.eligible
        ? null
        : line.exclusionReason || "product_metafield_excluded",
    };
  });
  const grossTotal = lines.reduce((sum, line) => sum + line.grossTotal, 0);
  const paidProductsTotal = lines.reduce(
    (sum, line) => sum + line.paidTotal,
    0,
  );
  const eligibleTotal = lines.reduce(
    (sum, line) => sum + line.eligibleAmount,
    0,
  );
  const excludedTotal = paidProductsTotal - eligibleTotal;
  const pointsEarned =
    input.rule.spendingUnitClp > 0 && input.rule.pointsPerUnit > 0
      ? Math.floor(eligibleTotal / input.rule.spendingUnitClp) *
        input.rule.pointsPerUnit
      : 0;

  return {
    lines,
    grossTotal,
    discountTotal: clpInteger(input.discount, "El descuento"),
    paidProductsTotal,
    eligibleTotal,
    excludedTotal,
    pointsEarned,
    calculationVersion: LOYALTY_CALCULATION_VERSION,
  };
}

export function calculatePointsToKeepAfterRefund(input: {
  originalEligibleTotal: number;
  cumulativeEligibleRefund: number;
  rule: Pick<LoyaltyRuleSnapshot, "spendingUnitClp" | "pointsPerUnit">;
}): number {
  const original = clpInteger(
    input.originalEligibleTotal,
    "El monto elegible original",
  );
  const refunded = Math.min(
    original,
    clpInteger(input.cumulativeEligibleRefund, "El monto elegible devuelto"),
  );

  if (input.rule.spendingUnitClp <= 0 || input.rule.pointsPerUnit <= 0) {
    throw new Error("La regla histórica de puntos no es válida");
  }

  return (
    Math.floor((original - refunded) / input.rule.spendingUnitClp) *
    input.rule.pointsPerUnit
  );
}
