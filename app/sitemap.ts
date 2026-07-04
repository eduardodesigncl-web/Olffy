import { getCollections, getPages, getProducts } from "lib/shopify";
import { baseUrl, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

const reservedRouteSegments = new Set([
  "admin",
  "cuenta",
  "api",
  "auth",
  "login",
  "search",
  "producto",
  "product",
  "tienda",
]);

function isReservedRoute(path: string) {
  const pathWithoutQuery = path.split(/[?#]/)[0] ?? "";
  const firstSegment = pathWithoutQuery
    .split("/")
    .filter(Boolean)[0]
    ?.toLowerCase();

  return firstSegment ? reservedRouteSegments.has(firstSegment) : false;
}

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
    collections
      .filter((collection) => !isReservedRoute(collection.path))
      .map((collection) => ({
        url: `${baseUrl}${collection.path}`,
        lastModified: collection.updatedAt,
      })),
  );

  // La URL canónica de producto en OLFFY es /tienda/[handle] (frontend
  // oficial). /producto/[id] y /product/[handle] redirigen a ella y no
  // deben estar en el sitemap.
  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}/tienda/${product.handle}`,
      lastModified: product.updatedAt,
    })),
  );

  const pagesPromise = getPages().then((pages) =>
    pages
      .filter((page) => !isReservedRoute(page.handle))
      .map((page) => ({
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
