export function allocateSaleLineDiscounts<T extends { grossTotal: number }>(
  items: T[],
  discount: number,
) {
  const safeDiscount = Math.max(Math.round(discount), 0);
  const gross = items.reduce((total, item) => total + item.grossTotal, 0);
  let assigned = 0;

  return items.map((item, index) => {
    const allocatedDiscount =
      index === items.length - 1
        ? Math.min(Math.max(safeDiscount - assigned, 0), item.grossTotal)
        : Math.min(
            Math.round(
              safeDiscount * (gross > 0 ? item.grossTotal / gross : 0),
            ),
            item.grossTotal,
          );
    assigned += allocatedDiscount;
    return {
      ...item,
      allocatedDiscount,
      paidTotal: Math.max(item.grossTotal - allocatedDiscount, 0),
    };
  });
}
