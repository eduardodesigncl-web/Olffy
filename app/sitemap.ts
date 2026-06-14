import { getCollections, getPages, getProducts } from "lib/shopify";
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

  const collectionsPromise = getCollections().then((collections) =>
    collections.map((collection) => ({
      url: `${baseUrl}${collection.path}`,
      lastModified: collection.updatedAt,
    })),
  );

  // La URL canónica de producto en OLFFY es /producto/[handle]
  // /product/[handle] redirige a /producto/[handle] — no debe estar en sitemap
  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/producto/${product.handle}`,
      lastModified: product.updatedAt,
    })),
  );

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: page.updatedAt,
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([collectionsPromise, productsPromise, pagesPromise])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...staticRoutes, ...fetchedRoutes];
}
