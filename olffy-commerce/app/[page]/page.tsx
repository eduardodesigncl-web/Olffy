import Link from "next/link";
import { notFound } from "next/navigation";

const allowedLegacyPages = new Set(["terminos", "privacidad", "envios"]);

export async function generateStaticParams() {
  return Array.from(allowedLegacyPages).map((page) => ({ page }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;

  if (!allowedLegacyPages.has(page)) notFound();

  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-3xl rounded-[8px] border-2 border-olffy-ink bg-white p-8">
        <h1 className="font-brand text-4xl font-black text-olffy-ink">
          Pagina en preparacion
        </h1>
        <p className="mt-4 leading-7 text-olffy-muted">
          Esta seccion quedo reservada para el contenido legal y de ayuda de
          Olffy. Se puede completar cuando esten las politicas finales.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[6px] bg-olffy-ink px-5 py-3 font-brand font-black text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
