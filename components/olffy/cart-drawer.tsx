"use client";

import Image from "next/image";
import Link from "next/link";
import type { Cart } from "lib/shopify/types";
import { DEFAULT_OPTION } from "lib/constants";
import {
  redirectToCheckout,
  removeItemFromForm,
  updateItemQuantityFromForm,
} from "components/cart/actions";
import { formatPrice } from "./data";
import { Flower } from "./flower";
import { useState } from "react";

export function OlffyCartDrawer({ cart }: { cart?: Cart }) {
  const [open, setOpen] = useState(false);
  const count = cart?.totalQuantity ?? 0;
  const hasCart = Boolean(cart?.lines.length);
  const total = Number(cart?.cost.totalAmount.amount ?? 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Carrito"
        className="relative flex h-[38px] items-center gap-[7px] rounded-[11px] bg-olffy-ink px-[13px] text-[13px] font-semibold text-white"
      >
        <CartIcon className="h-4 w-4" />
        <span className="min-w-5 rounded-full bg-olffy-yellow px-[7px] py-px text-center text-[11px] font-bold leading-4 text-olffy-ink">
          {count}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[500] flex justify-end">
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-olffy-ink/50 backdrop-blur-[2px]"
          />
          <aside className="relative z-[1] flex h-full w-[min(440px,96vw)] flex-col bg-white shadow-[-12px_0_60px_rgba(0,0,0,.18)]">
            <div className="flex items-center justify-between border-b border-olffy-ink/10 px-6 pb-[18px] pt-[22px]">
              <div>
                <div className="font-brand text-[21px] font-black leading-none text-olffy-ink">
                  Tu carrito
                </div>
                <div className="mt-1 text-[12.5px] text-olffy-ink/50">
                  {count} producto{count === 1 ? "" : "s"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-olffy-ink/6 text-lg leading-none text-olffy-ink"
                aria-label="Cerrar carrito"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!hasCart ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
                  <Flower className="h-16 w-16 text-olffy-yellow/50" />
                  <div className="text-base font-semibold text-olffy-ink">
                    Tu carrito está vacío
                  </div>
                  <Link
                    href="/tienda"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-olffy-orange px-6 py-3 text-sm font-semibold text-white"
                  >
                    Ir a la tienda
                  </Link>
                </div>
              ) : (
                cart!.lines.map((item) => (
                  <div
                    key={item.id ?? item.merchandise.id}
                    className="flex items-center gap-[13px] border-b border-olffy-ink/6 py-[13px]"
                  >
                    <div className="relative grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#deddf2]">
                      {item.merchandise.product.featuredImage?.url ? (
                        <Image
                          src={item.merchandise.product.featuredImage.url}
                          alt={
                            item.merchandise.product.featuredImage.altText ||
                            item.merchandise.product.title
                          }
                          fill
                          sizes="60px"
                          className="object-cover opacity-80"
                        />
                      ) : (
                        <Flower className="h-7 w-7 text-olffy-ink/15" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-olffy-ink">
                        {item.merchandise.product.title}
                      </div>
                      <div className="mt-px text-xs text-olffy-ink/50">
                        {item.merchandise.title === DEFAULT_OPTION
                          ? "Papelería"
                          : item.merchandise.title}
                      </div>
                      <div className="mt-2 flex items-center gap-[11px]">
                        <div className="flex items-center rounded-[9px] bg-olffy-ink/6 p-0.5">
                          <QuantityForm
                            merchandiseId={item.merchandise.id}
                            quantity={item.quantity - 1}
                            label="-"
                          />
                          <span className="min-w-5 text-center text-[13px] font-bold">
                            {item.quantity}
                          </span>
                          <QuantityForm
                            merchandiseId={item.merchandise.id}
                            quantity={item.quantity + 1}
                            label="+"
                            plus
                          />
                        </div>
                        <span className="font-brand text-[15px] font-bold text-olffy-orange">
                          {formatPrice(Number(item.cost.totalAmount.amount))}
                        </span>
                      </div>
                    </div>
                    <form action={removeItemFromForm}>
                      <input
                        type="hidden"
                        name="merchandiseId"
                        value={item.merchandise.id}
                      />
                      <button
                        type="submit"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] text-sm leading-none text-olffy-ink/35 hover:bg-olffy-ink/5"
                        aria-label="Eliminar producto"
                      >
                        x
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>

            {hasCart ? (
              <div className="border-t border-olffy-ink/10 px-6 pb-6 pt-4">
                <div className="mb-3.5 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-olffy-ink">
                    Total
                  </span>
                  <span className="font-brand text-2xl font-black text-olffy-orange">
                    {formatPrice(total)}
                  </span>
                </div>
                <form action={redirectToCheckout}>
                  <button
                    type="submit"
                    className="w-full rounded-[13px] bg-olffy-orange p-4 text-[15px] font-bold text-white shadow-[0_4px_0_#b23300]"
                  >
                    Ir al checkout →
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-1 w-full bg-transparent p-2.5 text-[13.5px] text-olffy-ink/50"
                >
                  Seguir comprando
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function QuantityForm({
  merchandiseId,
  quantity,
  label,
  plus = false,
}: {
  merchandiseId: string;
  quantity: number;
  label: string;
  plus?: boolean;
}) {
  return (
    <form action={updateItemQuantityFromForm}>
      <input type="hidden" name="merchandiseId" value={merchandiseId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button
        type="submit"
        className={
          plus
            ? "grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-olffy-purple text-base font-bold leading-none text-white"
            : "grid h-[26px] w-[26px] place-items-center rounded-[7px] text-base font-bold leading-none text-olffy-ink"
        }
      >
        {label}
      </button>
    </form>
  );
}

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 7h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 4H2" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="17" cy="21" r="1" />
    </svg>
  );
}
