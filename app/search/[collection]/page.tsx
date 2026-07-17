import { redirect } from "next/navigation";

// Ruta legacy de colección (/search/<handle>): redirige al catálogo oficial
// con la categoría preseleccionada. El handle de la colección es la categoría
// en kebab-case (tacos-de-notas → "tacos de notas"); la tienda hace el match
// ignorando mayúsculas y acentos, así que no hace falta consultar Shopify.
export default async function LegacyCollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const categoria = collection.replace(/-/g, " ").trim();

  redirect(
    categoria
      ? `/tienda?categoria=${encodeURIComponent(categoria)}`
      : "/tienda",
  );
}
