import { getProducts } from "lib/shopify";
import { baseUrl, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const now = new Date().toISOString();

  // Rutas estáticas públicas — nunca incluir /admin, /cuenta, /api, /auth
  const staticRoutes: Route[] = [
    { url: `${baseUrl}/`, lastModified: now },
    { url: `${baseUrl}/tienda`, lastModified: now },
    { url: `${baseUrl}/novedades`, lastModified: now },
    { url: `${baseUrl}/regalos`, lastModified: now },
    { url: `${baseUrl}/nuestra-historia`, lastModified: now },
    { url: `${baseUrl}/contacto`, lastModified: now },
  ];

  // La URL canónica de producto en OLFFY es /tienda/[handle] (frontend
  // oficial). Las rutas legacy (/producto, /product, /search/<colección>)
  // redirigen a ella o al catálogo y no deben estar en el sitemap; las
  // páginas CMS de Shopify tampoco (solo existen placeholders legales).
  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/tienda/${product.handle}`,
      lastModified: product.updatedAt,
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = await productsPromise;
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...staticRoutes, ...fetchedRoutes];
}
