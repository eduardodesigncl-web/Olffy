"use client";

import Link from "next/link";
import { formatPrice, OlffyProduct } from "./data";
import { Flower } from "./flower";

const cardBackgrounds = ["#F2E0CC", "#FFE9A8", "#DEDDF2", "#FBD4C2", "#FFF1CE"];

function getProductBackground(product: OlffyProduct) {
  const source = product.id || product.handle || product.name;
  const score = Array.from(source).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );

  return cardBackgrounds[score % cardBackgrounds.length];
}

export function ProductCard({
  product,
  compact = false,
}: {
  product: OlffyProduct;
  compact?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-[14px] border border-olffy-ink/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(42,28,16,.1)]">
      <Link href={`/producto/${product.handle}`} className="block">
        <div
          className={
            compact
              ? "relative grid h-[180px] place-items-center overflow-hidden"
              : "relative grid aspect-[1.3/1] min-h-[210px] place-items-center overflow-hidden"
          }
          style={{ backgroundColor: getProductBackground(product) }}
        >
          <Flower className="h-11 w-11 text-olffy-ink/10" />
          {product.tag && product.tag !== "Disponible" ? (
            <span className="absolute left-3 top-3 rounded-full bg-olffy-yellow px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-olffy-ink">
              {product.tag}
            </span>
          ) : null}
          {!product.availableForSale ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-olffy-ink px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white">
              Sin stock
            </span>
          ) : null}
        </div>
        <div className="px-3.5 py-3.5">
          {!compact ? (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-olffy-purple">
              {product.category}
            </div>
          ) : null}
          <h3 className="line-clamp-2 min-h-[2.3em] text-[14.5px] font-medium leading-tight text-olffy-ink">
            {product.name}
          </h3>
          <div className="mt-1 font-brand text-[17px] font-bold leading-none text-olffy-ink">
            {formatPrice(product.price)}
          </div>
        </div>
      </Link>
    </article>
  );
}
