import { redirect } from "next/navigation";

// Ruta legacy de Next Commerce: la búsqueda vive en la tienda oficial.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q?.trim() ? `/tienda?q=${encodeURIComponent(q.trim())}` : "/tienda");
}
