import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, products } from "components/olffy/data";
import { ProductCard } from "components/olffy/product-card";
import { SiteFooter } from "components/olffy/site-footer";

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);

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
  const product = products.find((item) => item.id === id);

  if (!product) notFound();

  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
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
              Producto demo para el MVP Olffy. Ideal para ordenar ideas,
              decorar agendas y regalar una pieza de papeleria con identidad
              local.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button className="h-12 rounded-[6px] bg-olffy-ink font-brand font-black text-white">
                Agregar al carrito
              </button>
              <Link
                href="/carrito"
                className="inline-flex h-12 items-center justify-center rounded-[6px] border-2 border-olffy-ink bg-white font-brand font-black"
              >
                Ver carrito
              </Link>
            </div>
            <div className="mt-8 rounded-[8px] border-2 border-olffy-ink bg-white p-5 text-sm leading-6 text-olffy-muted">
              <strong className="text-olffy-ink">Detalle MVP:</strong> stock,
              variantes y checkout se conectan a Shopify en la siguiente etapa.
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
