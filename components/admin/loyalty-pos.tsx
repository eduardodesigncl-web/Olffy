"use client";

import type {
  LoyaltyCustomer,
  LoyaltyRule,
  PhysicalSalePosBenefit,
} from "lib/loyalty/service";
import type { AdminPosVariant } from "lib/shopify/admin";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CartItem = AdminPosVariant & { quantity: number };

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("es-CL");

function amount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function LoyaltyPos({
  customers,
  rule,
}: {
  customers: LoyaltyCustomer[];
  rule: LoyaltyRule;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminPosVariant[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [benefitType, setBenefitType] =
    useState<PhysicalSalePosBenefit>("none");
  const [pointsToUse, setPointsToUse] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [benefitAmount, setBenefitAmount] = useState("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [tuuTransactionId, setTuuTransactionId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === customerId,
  );
  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart],
  );
  const pointsDiscount =
    benefitType === "points"
      ? Math.trunc(amount(pointsToUse)) * rule.point_redemption_value_clp
      : 0;
  const discount =
    benefitType === "points"
      ? pointsDiscount
      : benefitType === "none"
        ? 0
        : amount(benefitAmount);
  const total = Math.max(subtotal - discount, 0);
  const pointsEarned = selectedCustomer
    ? Math.floor(total / rule.spending_unit_clp) * rule.points_per_unit
    : 0;
  const maxPointsForSale = selectedCustomer
    ? Math.max(
        0,
        Math.min(
          selectedCustomer.points_balance,
          Math.floor(
            Math.max(subtotal - 1, 0) / rule.point_redemption_value_clp,
          ),
        ),
      )
    : 0;

  async function searchProducts() {
    setSearching(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/loyalty/products?q=${encodeURIComponent(query)}`,
      );
      const data = (await response.json()) as {
        variants?: AdminPosVariant[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron buscar productos");
      }

      setResults(data.variants ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron buscar productos",
      );
    } finally {
      setSearching(false);
    }
  }

  function addToCart(variant: AdminPosVariant) {
    setCart((current) => {
      const existing = current.find((item) => item.id === variant.id);

      if (existing) {
        return current.map((item) =>
          item.id === variant.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  variant.inventoryQuantity,
                ),
              }
            : item,
        );
      }

      return [...current, { ...variant, quantity: 1 }];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.id === variantId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(quantity || 1, item.inventoryQuantity),
              ),
            }
          : item,
      ),
    );
  }

  async function confirmSale() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/loyalty/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentConfirmed,
          customerId: selectedCustomer?.id ?? null,
          items: cart.map((item) => ({
            variantId: item.id,
            quantity: item.quantity,
          })),
          benefitType,
          pointsToUse: Math.trunc(amount(pointsToUse)),
          benefitAmount: amount(benefitAmount),
          discountCode,
          manualDiscountReason,
          tuuTransactionId,
          receiptNumber,
          responsible,
          notes,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        shopifyOrderName?: string;
        physicalSaleId?: number;
        alreadyCompleted?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudo completar la venta");
      }

      setSuccess(
        `${data.alreadyCompleted ? "Venta recuperada" : "Venta completada"}: orden ${data.shopifyOrderName || "Shopify"} y registro #${data.physicalSaleId}.`,
      );
      setCart([]);
      setBenefitType("none");
      setPointsToUse("");
      setBenefitAmount("");
      setDiscountCode("");
      setManualDiscountReason("");
      setTuuTransactionId("");
      setReceiptNumber("");
      setNotes("");
      setPaymentConfirmed(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar la venta",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const pointsInvalid =
    benefitType === "points" &&
    (!selectedCustomer ||
      amount(pointsToUse) <= 0 ||
      amount(pointsToUse) > maxPointsForSale);
  const discountInvalid =
    benefitType !== "none" &&
    benefitType !== "points" &&
    (amount(benefitAmount) <= 0 || amount(benefitAmount) >= subtotal);
  const detailsInvalid =
    (benefitType === "discount_code" && !discountCode.trim()) ||
    (benefitType === "manual_discount" && !manualDiscountReason.trim());
  const submitDisabled =
    submitting ||
    cart.length === 0 ||
    total <= 0 ||
    pointsInvalid ||
    discountInvalid ||
    detailsInvalid ||
    !tuuTransactionId.trim() ||
    !responsible.trim() ||
    !paymentConfirmed;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-semibold text-gray-900">
                Productos de Shopify
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Busca por nombre, variante o SKU. Precio y stock se validan
                nuevamente al confirmar.
              </p>
            </div>
            <form
              className="mt-4 flex gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void searchProducts();
              }}
            >
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: polera, talla M o SKU"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                disabled={searching}
                className="rounded-lg bg-olffy-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {searching ? "Buscando..." : "Buscar"}
              </button>
            </form>

            <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {results.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-4 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {variant.product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {variant.title} · SKU {variant.sku || "sin SKU"}
                    </p>
                    <p className="mt-1 text-xs">
                      {currencyFormatter.format(Number(variant.price))} ·{" "}
                      <span
                        className={
                          variant.inventoryQuantity > 0
                            ? "text-green-700"
                            : "text-red-600"
                        }
                      >
                        {variant.inventoryQuantity} disponibles
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={variant.inventoryQuantity <= 0}
                    onClick={() => addToCart(variant)}
                    className="shrink-0 rounded-lg border border-olffy-purple px-3 py-2 text-xs font-semibold text-olffy-purple disabled:border-gray-200 disabled:text-gray-400"
                  >
                    Agregar
                  </button>
                </div>
              ))}
              {!searching && results.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">
                  Busca un producto para comenzar la venta.
                </p>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">Carrito</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_90px_120px_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.title} · {item.sku || "sin SKU"}
                    </p>
                  </div>
                  <input
                    aria-label={`Cantidad de ${item.product.title}`}
                    type="number"
                    min="1"
                    max={item.inventoryQuantity}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.id, Number(event.target.value))
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-sm font-semibold text-gray-900">
                    {currencyFormatter.format(
                      Number(item.price) * item.quantity,
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setCart((current) =>
                        current.filter((entry) => entry.id !== item.id),
                      )
                    }
                    className="text-left text-xs font-semibold text-red-600 sm:text-right"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              {cart.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">
                  El carrito esta vacio.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Cliente</h2>
            <select
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setPointsToUse("");
                if (!event.target.value && benefitType === "points") {
                  setBenefitType("none");
                }
              }}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Venta anonima</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name || customer.email} ·{" "}
                  {numberFormatter.format(customer.points_balance)} pts
                </option>
              ))}
            </select>
            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              {selectedCustomer ? (
                <>
                  <p className="font-semibold text-gray-900">
                    {selectedCustomer.full_name || selectedCustomer.email}
                  </p>
                  <p className="mt-1 text-olffy-purple">
                    {numberFormatter.format(selectedCustomer.points_balance)}{" "}
                    puntos disponibles
                  </p>
                </>
              ) : (
                <p className="text-gray-600">
                  La venta anonima no acumula puntos.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Beneficio</h2>
            <p className="mt-1 text-xs text-gray-500">
              Solo se puede aplicar una opcion por venta.
            </p>
            <div className="mt-4 grid gap-2">
              {[
                ["none", "Sin beneficio"],
                ["points", "Usar puntos"],
                ["discount_code", "Codigo de descuento"],
                ["manual_discount", "Descuento manual autorizado"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm"
                >
                  <input
                    type="radio"
                    name="benefit"
                    value={value}
                    checked={benefitType === value}
                    disabled={value === "points" && !selectedCustomer}
                    onChange={() =>
                      setBenefitType(value as PhysicalSalePosBenefit)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            {benefitType === "points" ? (
              <label className="mt-4 block text-sm">
                <span className="font-medium text-gray-700">Puntos a usar</span>
                <input
                  type="number"
                  min="1"
                  max={maxPointsForSale}
                  value={pointsToUse}
                  onChange={(event) => setPointsToUse(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Maximo para esta venta:{" "}
                  {numberFormatter.format(maxPointsForSale)} pts. Cada punto
                  descuenta{" "}
                  {currencyFormatter.format(rule.point_redemption_value_clp)}.
                </span>
              </label>
            ) : null}

            {benefitType === "discount_code" ? (
              <div className="mt-4 grid gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Codigo</span>
                  <input
                    value={discountCode}
                    onChange={(event) => setDiscountCode(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">
                    Monto que aplica el codigo
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={benefitAmount}
                    onChange={(event) => setBenefitAmount(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
            ) : null}

            {benefitType === "manual_discount" ? (
              <div className="mt-4 grid gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">
                    Monto autorizado
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={benefitAmount}
                    onChange={(event) => setBenefitAmount(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">
                    Autorizacion y motivo
                  </span>
                  <textarea
                    rows={2}
                    value={manualDiscountReason}
                    onChange={(event) =>
                      setManualDiscountReason(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Pago TUU</h2>
            <div className="mt-4 grid gap-3">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">
                  Referencia de transaccion
                </span>
                <input
                  value={tuuTransactionId}
                  onChange={(event) => setTuuTransactionId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">
                  Numero de comprobante
                </span>
                <input
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Responsable</span>
                <input
                  value={responsible}
                  onChange={(event) => setResponsible(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Notas</span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-olffy-ink p-5 text-white shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal</span>
                <span>{currencyFormatter.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Beneficio</span>
                <span>-{currencyFormatter.format(discount)}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-3 text-xl font-black">
                <span>Total TUU</span>
                <span>{currencyFormatter.format(total)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-gray-300">
                <span>Puntos usados</span>
                <span>
                  {benefitType === "points"
                    ? numberFormatter.format(Math.trunc(amount(pointsToUse)))
                    : 0}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Puntos a sumar</span>
                <span>{numberFormatter.format(pointsEarned)}</span>
              </div>
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-lg bg-white/10 p-3 text-xs">
              <input
                type="checkbox"
                checked={paymentConfirmed}
                onChange={(event) => setPaymentConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              Confirmo que el pago por {currencyFormatter.format(total)} fue
              recibido en TUU y que la referencia ingresada es correcta.
            </label>
            <button
              type="button"
              disabled={submitDisabled}
              onClick={() => void confirmSale()}
              className="mt-4 w-full rounded-lg bg-olffy-orange px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Confirmando venta..."
                : "Confirmar pago y crear orden Shopify"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
