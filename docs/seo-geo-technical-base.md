# SEO/GEO técnico base — OLFFY

> Implementado el 14 de junio de 2026 como Tarea 8B del Sprint 1.
> Rama: `codex/shopify-loyalty-discounts`

---

## Resumen de implementación

Esta tarea implementa la infraestructura técnica SEO sin modificar lógica de negocio
(puntos, descuentos Shopify, POS TUU, registro cliente, Supabase).

---

## Diagnóstico previo

| Elemento                             | Estado antes                  | Estado después                                                 |
| ------------------------------------ | ----------------------------- | -------------------------------------------------------------- |
| `metadataBase`                       | ✅ Ya existía                 | ✅ Mejorado con NEXT_PUBLIC_SITE_URL                           |
| `title` global                       | ⚠️ "Olffy"                    | ✅ "OLFFY \| Papelería chilena creativa…"                      |
| `description` global                 | ⚠️ Genérica                   | ✅ Orientada al usuario chileno                                |
| Open Graph global                    | ❌ No existía                 | ✅ Implementado                                                |
| Twitter card global                  | ❌ No existía                 | ✅ Implementado                                                |
| Schema Organization                  | ❌ No existía                 | ✅ JSON-LD en `<head>` global                                  |
| `robots.ts`                          | ⚠️ Sin disallow               | ✅ Bloquea /admin/, /api/, /cuenta/, /auth/                    |
| noindex `/admin`                     | ❌ No existía                 | ✅ metadata en layout.tsx                                      |
| noindex `/cuenta`                    | ❌ No existía                 | ✅ metadata en layout.tsx                                      |
| `sitemap.ts` — rutas estáticas       | ⚠️ Solo "/"                   | ✅ /tienda, /novedades, /regalos, /nuestra-historia, /contacto |
| `sitemap.ts` — URL canónica producto | ❌ /product/[handle] (legacy) | ✅ /producto/[handle] (canónica real)                          |
| `generateMetadata` producto          | ⚠️ Solo title                 | ✅ title, description, canonical, OG, Twitter                  |
| Schema Product                       | ❌ No existía                 | ✅ JSON-LD en página de producto                               |
| Schema BreadcrumbList                | ❌ No existía                 | ✅ JSON-LD en página de producto                               |
| `/tienda` metadata                   | ⚠️ Solo title                 | ✅ title + description + OG                                    |
| `/search` metadata                   | ⚠️ En inglés                  | ✅ En español + noindex (thin content)                         |
| `NEXT_PUBLIC_SITE_URL`               | ⚠️ Solo documentado           | ✅ Documentado con nota de prioridad                           |

---

## Archivos modificados

| Archivo                                                           | Cambio                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`lib/utils.ts`](../lib/utils.ts)                                 | `baseUrl` da prioridad a `NEXT_PUBLIC_SITE_URL`                                 |
| [`app/layout.tsx`](../app/layout.tsx)                             | metadata global mejorada, OG, Twitter card, schema Organization                 |
| [`app/robots.ts`](../app/robots.ts)                               | Disallow /admin/, /api/, /cuenta/, /auth/                                       |
| [`app/sitemap.ts`](../app/sitemap.ts)                             | Rutas estáticas públicas, URL canónica producto corrected                       |
| [`app/admin/layout.tsx`](../app/admin/layout.tsx)                 | noindex + nofollow                                                              |
| [`app/cuenta/layout.tsx`](../app/cuenta/layout.tsx)               | noindex + nofollow                                                              |
| [`app/tienda/page.tsx`](../app/tienda/page.tsx)                   | metadata title + description + OG                                               |
| [`app/search/page.tsx`](../app/search/page.tsx)                   | metadata en español + noindex                                                   |
| [`app/producto/[id]/page.tsx`](../app/producto/%5Bid%5D/page.tsx) | generateMetadata completo, canonical, OG, schema Product, schema BreadcrumbList |
| [`.env.example`](../.env.example)                                 | Documentación NEXT_PUBLIC_SITE_URL                                              |

---

## Rutas en sitemap

```
/ — Homepage
/tienda — Tienda principal
/novedades — Novedades
/regalos — Regalos
/nuestra-historia — Sobre OLFFY
/contacto — Contacto
/search/[collection] — Colecciones Shopify (dinámico)
/producto/[handle] — Fichas de producto (dinámico, canónica real)
/[handle] — Páginas CMS de Shopify (dinámico)
```

> ⚠️ El sitemap no incluye rutas privadas (/admin, /cuenta, /api, /auth).

---

## Rutas bloqueadas en robots.txt

```
Disallow: /admin/
Disallow: /api/
Disallow: /cuenta/
Disallow: /auth/
```

Adicionalmente, `/admin`, `/cuenta` y sus subrutas exportan `robots: { index: false, follow: false }` como metadata HTML (doble capa de protección).

La ruta `/search` tiene `index: false, follow: true` para evitar thin content pero
permitir que los crawlers sigan los enlaces internos.

---

## Schemas JSON-LD implementados

### Organization (global, en `<head>`)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OLFFY",
  "url": "https://www.olffy.cl",
  "description": "Papelería chilena creativa..."
}
```

### Product (por página `/producto/[id]`)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[nombre del producto]",
  "description": "[descripción]",
  "image": "[url imagen Shopify]",
  "url": "https://www.olffy.cl/producto/[handle]",
  "offers": {
    "@type": "Offer",
    "price": "[precio CLP]",
    "priceCurrency": "CLP",
    "availability": "https://schema.org/InStock | OutOfStock",
    "seller": { "@type": "Organization", "name": "OLFFY" }
  }
}
```

### BreadcrumbList (por página `/producto/[id]`)

```
Inicio → Tienda → [Nombre del producto]
```

---

## Decisión de canónica: /product vs /producto

- `/product/[handle]` redirige a `/producto/[handle]` con `redirect()` en Next.js.
- La canónica real es `/producto/[handle]`.
- El sitemap ahora usa `/producto/[handle]` (corregido).
- Las metadata de la ficha de producto apuntan su canonical a `/producto/[handle]`.
- **No se implementó redirect 301 explícito** ya que el `redirect()` de Next.js
  emite 307 en producción. Si se requiere 301 permanente, documentar y configurar
  en `next.config.ts` o middleware.

---

## Variables de entorno requeridas

| Variable                        | Uso                                       | Notas                                                                                              |
| ------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | `baseUrl` para canonical, sitemap, schema | Configurar en Vercel Production. Prioridad sobre `VERCEL_PROJECT_PRODUCTION_URL`. Sin barra final. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Fallback automático                       | Inyectada por Vercel. No configurar manualmente.                                                   |

---

## Riesgos restantes

| Riesgo                                                       | Nivel        | Descripción                                                                                                                                                    |
| ------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` no configurada en Vercel              | 🟡 Medio     | Si no está configurada, `baseUrl` usa `VERCEL_PROJECT_PRODUCTION_URL` (automática) — funciona pero la URL puede ser `*.vercel.app` en lugar del dominio custom |
| `/product/[handle]` en sitemap antiguo                       | ✅ Corregido | Ya usa `/producto/[handle]`                                                                                                                                    |
| Redirect `/product` a `/producto` es 307, no 301             | 🟡 Bajo      | SEO prefiere 301. Requiere configuración en `next.config.ts` si se quiere 301 explícito                                                                        |
| Schema Product con imagen de Unsplash (demo)                 | 🟡 Bajo      | Si Shopify tiene las imágenes reales, se usan automáticamente. El fallback de demo es aceptable temporalmente                                                  |
| Open Graph sin imagen global configurada                     | 🟡 Bajo      | Las páginas de producto tienen imagen OG. La homepage no tiene image OG explícita por ahora                                                                    |
| Logo Organization no declarado en schema                     | 🟡 Bajo      | Solo agregar cuando exista un asset de logo real en `/public`                                                                                                  |
| Colecciones en `/search/[collection]` — noindex no explícito | ✅ Aceptable | Son páginas públicas indexables según Shopify SEO                                                                                                              |

---

## Pendiente para próximas iteraciones

- Redirect 301 de `/product/[handle]` → `/producto/[handle]` en `next.config.ts`.
- Schema FAQ cuando exista la página `/preguntas-frecuentes`.
- Open Graph image global (logo o banner OLFFY real).
- Logo en schema Organization.
- Metadata canónica para colecciones en `/search/[collection]`.
- Libretas como categoría SEO cuando esté integrada al diseño.
- `<link rel="canonical">` en la página de búsqueda con query.
