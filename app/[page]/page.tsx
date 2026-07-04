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
    <section className="px-4 py-[clamp(36px,4.5vw,56px)]">
      <div className="mx-auto max-w-3xl rounded-[22px] border border-olffy-ink/10 bg-white p-8 shadow-[0_12px_32px_rgba(42,28,16,.08)]">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
          OLFFY
        </div>
        <h1 className="font-brand text-4xl font-black text-olffy-ink">
          Pagina en preparacion
        </h1>
        <p className="mt-4 leading-7 text-olffy-ink/70">
          Esta seccion quedo reservada para el contenido legal y de ayuda de
          Olffy. Se puede completar cuando esten las politicas finales.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[13px] bg-olffy-orange px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_#b23300]"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
