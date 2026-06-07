import Image from "next/image";
import { NewsletterBand } from "components/olffy/newsletter";
import { SectionHeading } from "components/olffy/section-heading";
import { SiteFooter } from "components/olffy/site-footer";
import { storyImages } from "components/olffy/data";

export const metadata = {
  title: "Nuestra historia",
};

const [heroImage, workshopImage, storeImage, processImage] = storyImages as [
  string,
  string,
  string,
  string,
];

export default function StoryPage() {
  return (
    <>
      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-center font-brand text-5xl font-black text-olffy-ink md:text-8xl">
            Nuestra historia
          </h1>
          <div className="relative mt-8 min-h-[360px] overflow-hidden rounded-[8px] border-2 border-olffy-ink md:min-h-[520px]">
            <Image
              src={heroImage}
              alt="Mesa creativa Olffy"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 text-center">
        <SectionHeading
          title="Como nacio OLFFY"
          copy="Olffy nace desde una idea simple: darle a la papeleria un lugar mas humano, cercano y chileno. Queremos que cada agenda, libreta o sticker sea una invitacion a crear."
        />
      </section>

      <section className="px-5 py-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          {[workshopImage, storeImage].map((image, index) => (
            <div
              key={image}
              className="relative aspect-[4/3] overflow-hidden rounded-[8px] border-2 border-olffy-ink"
            >
              <Image
                src={image}
                alt={`Historia Olffy ${index + 1}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <h2 className="font-brand text-4xl font-black text-olffy-ink">
              Nuestra tienda
            </h2>
            <p className="mt-5 leading-8 text-olffy-muted">
              Un espacio en Viña del Mar para descubrir productos, conocer
              artistas y encontrar regalos con identidad.
            </p>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[8px] border-2 border-olffy-ink">
            <Image
              src={processImage}
              alt="Tienda creativa"
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Proceso creativo"
            copy="Seleccionamos materiales, colaboramos con artistas y cuidamos cada empaque para que la experiencia empiece antes de abrir el producto."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[heroImage, processImage].map((image) => (
              <div
                key={image}
                className="relative aspect-[4/3] overflow-hidden rounded-[8px] border-2 border-olffy-ink"
              >
                <Image
                  src={image}
                  alt="Proceso creativo Olffy"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterBand />
      <SiteFooter />
    </>
  );
}
