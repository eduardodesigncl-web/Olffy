import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "components/olffy/data";
import { ProductCard } from "components/olffy/product-card";
import {
  getOlffyProduct,
  getOlffyProducts,
} from "components/olffy/shopify-products";
import { SiteFooter } from "components/olffy/site-footer";

export async function generateStaticParams() {
  const products = await getOlffyProducts();

  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getOlffyProduct(id);

  return {
    title: product?.name ?? "Producto",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getOlffyProduct(id);

  if (!product) notFound();

  const products = await getOlffyProducts();
  const related = products
    .filter(
      (item) =>
        item.category === product.category && item.handle !== product.handle,
    )
    .slice(0, 3);

  return (
    <>
      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-olffy-cream">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-olffy-purple">
              {product.category}
            </p>
            <h1 className="mt-4 font-brand text-5xl font-black leading-none text-olffy-ink md:text-7xl">
              {product.name}
            </h1>
            <p className="mt-5 text-2xl font-bold text-olffy-ink">
              {formatPrice(product.price)}
            </p>
            <p className="mt-6 max-w-xl leading-8 text-olffy-muted">
              {product.description ||
                "Producto Olffy ideal para ordenar ideas, decorar agendas y regalar una pieza de papeleria con identidad local."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full bg-olffy-cream px-4 py-2 text-olffy-ink">
                {product.availableForSale ? "Disponible" : "Sin stock"}
              </span>
              {typeof product.quantityAvailable === "number" ? (
                <span className="rounded-full bg-white px-4 py-2 text-olffy-purple ring-2 ring-olffy-ink">
                  Stock: {product.quantityAvailable}
                </span>
              ) : null}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                disabled={!product.availableForSale}
                className="h-12 rounded-[6px] bg-olffy-ink font-brand font-black text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {product.availableForSale ? "Agregar al carrito" : "Sin stock"}
              </button>
              <Link
                href="/carrito"
                className="inline-flex h-12 items-center justify-center rounded-[6px] border-2 border-olffy-ink bg-white font-brand font-black"
              >
                Ver carrito
              </Link>
            </div>
            <div className="mt-8 rounded-[8px] border-2 border-olffy-ink bg-white p-5 text-sm leading-6 text-olffy-muted">
              <strong className="text-olffy-ink">Inventario Shopify:</strong>{" "}
              esta ficha lee la disponibilidad desde la API Storefront. El
              checkout queda como siguiente etapa del MVP.
            </div>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="px-5 pb-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-brand text-3xl font-black text-olffy-ink">
              Tambien podria gustarte
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <SiteFooter />
    </>
  );
}
