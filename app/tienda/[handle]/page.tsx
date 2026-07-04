import { getProduct, getProducts } from "lib/shopify";
import { notFound } from "next/navigation";
import { toOlffyProduct } from "src/olffy/integration/mappers";
import { ProductDetailClient } from "src/olffy/integration/ProductDetailClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export async function generateStaticParams() {
  const products = await getProducts({
    sortKey: "CREATED_AT",
    reverse: true,
  });

  return products.length
    ? products.map((product) => ({ handle: product.handle }))
    : [{ handle: "__missing-product__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  return {
    title: product.title,
    description:
      product.description ||
      `${product.title} - papelería OLFFY con diseño desde Viña del Mar.`,
  };
}

export default async function TiendaProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) notFound();

  return (
    <OlffyStorefront>
      <ProductDetailClient product={toOlffyProduct(product)} />
    </OlffyStorefront>
  );
}
