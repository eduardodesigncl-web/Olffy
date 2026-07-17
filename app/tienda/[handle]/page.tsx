import { getProduct, getProducts } from "lib/shopify";
import { notFound } from "next/navigation";
import { relatedProductsFor } from "src/olffy/data/productDetails";
import { toOlffyProduct, toOlffyProducts } from "src/olffy/integration/mappers";
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
  const [product, shopifyProducts] = await Promise.all([
    getProduct(handle),
    getProducts({ sortKey: "CREATED_AT", reverse: true }),
  ]);

  if (!product) notFound();

  const olffyProduct = toOlffyProduct(product);
  const catalog = toOlffyProducts(shopifyProducts);

  // Datos estructurados de producto (rich results en Google).
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: olffyProduct.desc,
    image: olffyProduct.images ?? (olffyProduct.image ? [olffyProduct.image] : []),
    offers: {
      "@type": "Offer",
      availability: olffyProduct.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: "CLP",
      price: olffyProduct.n,
    },
  };

  return (
    <OlffyStorefront>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        product={olffyProduct}
        relatedProducts={relatedProductsFor(olffyProduct, catalog)}
      />
    </OlffyStorefront>
  );
}
