import Image from "next/image";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ProductCard } from "components/olffy/product-card";
import { getOlffyProducts } from "components/olffy/shopify-products";
import { SiteFooter } from "components/olffy/site-footer";

const filters = ["Categoria", "Precio", "Ordenar"];

export const metadata = {
  title: "Tienda",
};

export default async function StorePage() {
  const products = await getOlffyProducts();

  return (
    <>
      <section className="px-5 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[360px] overflow-hidden rounded-[8px] border-2 border-olffy-ink bg-olffy-cream md:min-h-[520px]">
            <Image
              src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80"
              alt="Lanzamientos de papeleria Olffy"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-white/45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <h1 className="font-brand text-5xl font-black text-olffy-ink md:text-7xl">
                Lanzamientos
              </h1>
              <a
                href="#productos"
                className="mt-7 rounded-[6px] border-2 border-olffy-ink bg-white px-7 py-3 font-brand font-black"
              >
                Ver nuevos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="productos" className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className="inline-flex h-10 items-center gap-8 rounded-[6px] border-2 border-olffy-ink bg-white px-4 font-brand text-sm font-black"
                >
                  {filter}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <span className="text-sm font-semibold text-olffy-muted">
              {products.length} productos
            </span>
          </div>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-14 flex justify-end gap-4 font-brand text-lg font-black">
            <span className="rounded-[6px] bg-olffy-ink px-3 py-1 text-white">1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
