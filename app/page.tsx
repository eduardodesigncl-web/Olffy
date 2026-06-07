import Image from "next/image";
import Link from "next/link";
import { NewsletterBand } from "components/olffy/newsletter";
import { ProductCard } from "components/olffy/product-card";
import { SectionHeading } from "components/olffy/section-heading";
import { SiteFooter } from "components/olffy/site-footer";
import { categories, storyImages } from "components/olffy/data";
import { getOlffyProducts } from "components/olffy/shopify-products";

export const metadata = {
  description:
    "Olffy: papeleria chilena creativa, agendas, stickers, libretas y regalos para artistas.",
};

export default async function HomePage() {
  const products = await getOlffyProducts();
  const featured = products.slice(0, 4);
  const favorites = products.filter((product) => product.tag === "Favorito");
  const favoriteProducts = favorites.length ? favorites : products.slice(0, 4);

  return (
    <>
      <section className="px-5 pb-16 pt-10 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="mx-auto max-w-5xl text-center font-brand text-5xl font-black leading-none text-olffy-ink md:text-8xl">
            Bienvenido a Olffy
          </h1>
          <div className="relative mt-8 min-h-[360px] overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-olffy-cream md:min-h-[560px]">
            <Image
              src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=80"
              alt="Papeleria creativa sobre escritorio"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-olffy-ink/55 via-transparent to-white/15" />
            <div className="absolute bottom-8 left-6 max-w-lg text-white md:bottom-12 md:left-12">
              <p className="font-brand text-3xl font-black md:text-5xl">
                Amor hecho con las manos
              </p>
              <p className="mt-4 text-sm leading-6 md:text-base">
                Productos de papeleria para ordenar ideas, regalar bonito y
                celebrar la creatividad local.
              </p>
              <Link
                href="/tienda"
                className="mt-6 inline-flex rounded-[6px] bg-olffy-yellow px-6 py-3 font-brand font-black text-olffy-ink"
              >
                Explorar tienda
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <div>
            <p className="font-brand text-3xl font-black text-olffy-ink">
              Lanzamientos nuevos
            </p>
            <div className="mt-4 flex gap-2">
              <span className="h-1 w-16 rounded-full bg-olffy-ink" />
              <span className="h-1 w-16 rounded-full bg-olffy-yellow" />
              <span className="h-1 w-16 rounded-full bg-olffy-orange" />
            </div>
            <p className="mt-5 max-w-md text-olffy-muted">
              Agendas, stickers y sets pensados para iniciar proyectos con una
              mesa llena de color.
            </p>
            <Link
              href="/novedades"
              className="mt-6 inline-flex rounded-[6px] bg-olffy-ink px-5 py-3 font-brand text-sm font-black text-white"
            >
              Ver nuevos
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-white">
            <Image
              src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80"
              alt="Escritorio creativo con papeleria"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-brand text-3xl font-black text-olffy-ink">
              Nuevos productos
            </h2>
            <Link href="/tienda" className="text-sm font-bold text-olffy-purple">
              Ver todo
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <h2 className="font-brand text-4xl font-black text-olffy-ink">
              Conoce OLFFY
            </h2>
            <p className="text-lg leading-8 text-olffy-muted">
              Somos una marca chilena de papeleria que conecta productos de
              alta calidad con artistas locales. Nuestra tienda en Viña del Mar
              es un puente entre la creacion y el publico.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {storyImages.slice(0, 3).map((image, index) => (
              <div
                key={image}
                className="relative aspect-[4/3] overflow-hidden rounded-[8px] border-2 border-olffy-ink"
              >
                <Image
                  src={image}
                  alt={`Olffy historia ${index + 1}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Producto en uso"
            copy="Ideas reales: escribir, ordenar, rayar, pegar y volver a empezar."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border-2 border-olffy-ink">
              <Image
                src="https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1600&q=80"
                alt="Producto Olffy en uso"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {categories.slice(0, 3).map((category) => (
                <Link
                  key={category}
                  href="/tienda"
                  className="rounded-[8px] border-2 border-olffy-ink bg-white p-6 transition hover:-translate-y-1 hover:bg-olffy-yellow"
                >
                  <p className="font-brand text-2xl font-black">{category}</p>
                  <p className="mt-2 text-sm text-olffy-muted">
                    Descubre piezas para tu rutina creativa.
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-brand text-3xl font-black text-olffy-ink">
            Productos favoritos
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <NewsletterBand />
      <SiteFooter />
    </>
  );
}
