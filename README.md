# Olffy Commerce MVP

MVP ecommerce de Olffy construido con Next.js, Vercel y Shopify Headless.

Las paginas de tienda, novedades, regalos, carrito MVP y ficha de producto leen productos desde Shopify Storefront API cuando existen las variables de entorno. Si faltan variables en local, el proyecto usa productos demo para poder compilar y trabajar sin romper el flujo.

## Variables de entorno

Configura estas variables en Vercel para conectar el inventario:

- `SHOPIFY_STORE_DOMAIN`: dominio `.myshopify.com` de la tienda, por ejemplo `tu-tienda.myshopify.com`.
- `SHOPIFY_STORE_DOMINIO`: alias aceptado si ya lo configuraste asi en Vercel.
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: token Storefront publico compatible con Next Commerce.
- `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN`: usa esta variable si tienes un token privado de Headless.
- `SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN`: alternativa explicita para token publico.
- `SHOPIFY_REVALIDATION_SECRET`: opcional para webhooks de revalidacion.
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN`: token Admin API para el panel personalizado.
  Debe ser un access token real; un Client Secret con prefijo `shpss_` no sirve
  como token.
- `SHOPIFY_ADMIN_API_CLIENT_ID` y `SHOPIFY_ADMIN_API_CLIENT_SECRET`: alternativa
  recomendada para una app propia instalada. El backend obtiene y renueva el
  access token automaticamente.
- `SHOPIFY_ADMIN_API_VERSION`: version Admin API. Por defecto usa `2026-04`.
- `ADMIN_PASSWORD`: contrasena para entrar a `/admin/login`.

No subas un archivo `.env` real al repositorio.

El despliegue y QA de los canjes conectados con Shopify se documentan en
[docs/deployment-shopify-discounts.md](docs/deployment-shopify-discounts.md).

## Shopify

Para que un producto aparezca en el MVP, debe cumplir con esto en Shopify:

- Estado del producto: `Activo`.
- Publicado en el canal Headless.
- Permisos Storefront habilitados para leer productos e inventario.
- Variante con precio y disponibilidad.
- Inventario disponible si se esta usando control de stock.

## Desarrollo local

Instala dependencias y ejecuta:

```bash
npm run dev
```

Para probar localmente contra Shopify, crea un `.env.local` usando [.env.example](.env.example) como base.
