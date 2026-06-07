# Olffy Commerce MVP

MVP ecommerce de Olffy construido con Next.js, Vercel y Shopify Headless.

Las paginas de tienda, novedades, regalos, carrito MVP y ficha de producto leen productos desde Shopify Storefront API cuando existen las variables de entorno. Si faltan variables en local, el proyecto usa productos demo para poder compilar y trabajar sin romper el flujo.

## Variables de entorno

Configura estas variables en Vercel para conectar el inventario:

- `SHOPIFY_STORE_DOMAIN`: dominio `.myshopify.com` de la tienda, por ejemplo `tu-tienda.myshopify.com`.
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: token privado de Headless Storefront API.
- `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN`: alternativa explicita para el token privado.
- `SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN`: solo si usas token publico.
- `SHOPIFY_REVALIDATION_SECRET`: opcional para webhooks de revalidacion.

No subas un archivo `.env` real al repositorio.

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
