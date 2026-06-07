import Image from "next/image";
import { products } from "components/olffy/data";
import { ProductCard } from "components/olffy/product-card";
import { SectionHeading } from "components/olffy/section-heading";
import { SiteFooter } from "components/olffy/site-footer";

const giftGroups = [
  "Regalos para amigas",
  "Regalos para estudiantes",
  "Kits de papeleria",
  "Hasta $5.000",
  "Hasta $10.000",
  "Hasta $15.000",
  "Empaque para regalo",
  "Mas vendidos",
  "Proximamente",
];

export const metadata = {
  title: "Regalos",
};

export default function GiftsPage() {
  const gifts = products.filter(
    (product) => product.tag === "Regalo" || product.price <= 10000,
  );

  return (
    <>
      <section className="px-5 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 rounded-[8px] border-2 border-olffy-ink bg-white p-4 md:grid-cols-3">
            {giftGroups.map((group) => (
              <a
                key={group}
                href="#regalos"
                className="rounded-[6px] border border-neutral-200 bg-olffy-cream px-5 py-4 font-brand font-black text-olffy-ink hover:bg-olffy-yellow"
              >
                {group}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border-2 border-olffy-ink">
            <Image
              src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1600&q=80"
              alt="Regalos de papeleria Olffy"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-olffy-cream/60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <h1 className="font-brand text-5xl font-black text-olffy-ink md:text-7xl">
                Regalos con amor
              </h1>
              <p className="mt-4 max-w-xl text-olffy-ink">
                Kits, detalles y empaques para sorprender a personas creativas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="regalos" className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Listo para regalar"
            copy="Seleccionamos productos accesibles, utiles y llenos de color."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {gifts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
