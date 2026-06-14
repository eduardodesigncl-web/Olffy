import Image from "next/image";
import Link from "next/link";
import { formatPrice, OlffyProduct } from "./data";

export function ProductCard({ product }: { product: OlffyProduct }) {
  return (
    <Link href={`/producto/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] border-2 border-olffy-ink bg-olffy-cream">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-olffy-ink">
          {product.tag}
        </span>
        {!product.availableForSale ? (
          <div className="absolute inset-x-0 bottom-0 bg-olffy-ink px-3 py-2 text-center font-brand text-sm font-black text-white">
            Sin stock
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-brand text-lg leading-tight text-olffy-ink">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-olffy-muted">{product.category}</p>
          {typeof product.quantityAvailable === "number" &&
          product.availableForSale ? (
            <p className="mt-1 text-xs font-semibold text-olffy-purple">
              Stock: {product.quantityAvailable}
            </p>
          ) : null}
        </div>
        <p className="font-semibold text-olffy-ink">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
