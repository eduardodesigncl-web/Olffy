import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "components/olffy/product-card";
import { SectionHeading } from "components/olffy/section-heading";
import { getOlffyProducts } from "components/olffy/shopify-products";
import { SiteFooter } from "components/olffy/site-footer";

export const metadata = {
  title: "Novedades",
};

export default async function NewsPage() {
  const products = await getOlffyProducts();
  const newProducts = products.filter((product) => product.tag === "Nuevo");
  const visibleProducts = newProducts.length ? newProducts : products.slice(0, 6);

  return (
    <>
      <section className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Nuevos lanzamientos"
            title="Lo recien salido del taller"
            copy="Papeleria para empezar una libreta, decorar una agenda o preparar un regalo con intencion."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border-2 border-olffy-ink">
              <Image
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1600&q=80"
                alt="Novedades Olffy"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="rounded-[8px] border-2 border-olffy-ink bg-white p-8">
              <h2 className="font-brand text-3xl font-black">Coleccion reciente</h2>
              <p className="mt-4 leading-7 text-olffy-muted">
                Una seleccion de planners, notas y detalles para transformar
                rutinas pequeñas en momentos creativos.
              </p>
              <Link
                href="/tienda"
                className="mt-6 inline-flex rounded-[6px] bg-olffy-orange px-6 py-3 font-brand font-black text-white"
              >
                Comprar novedades
              </Link>
            </div>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
