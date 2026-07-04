# Frontend oficial OLFFY (src/olffy)

Port del frontend oficial (`olffy-react-front`, Vite) al App Router de
Next.js, conectado al backend real. La UI (components/, pages/, styles/)
se mantiene 1:1 con el handoff; la carpeta `integration/` es la única capa
que conoce el backend.

## Estructura

- `components/`, `pages/`, `styles/`, `types/`, `data/` — código del
  frontend oficial (CSS Modules + tokens). `types/Product` se extendió con
  `handle`, `image`, `variantId` y `availableForSale` para Shopify.
- `context/CartContext.tsx` — carrito respaldado por el carrito real de
  Shopify: se hidrata en el cliente después del primer pintado
  (`getCartItemsAction`), con estado optimista local y reconciliación por
  server actions. Ninguna página bloquea su render esperando a Shopify,
  lo que permite prerender estático completo.
- `integration/`
  - `mappers.ts` — Shopify Storefront → tipos del frontend.
  - `shell.tsx` + `OlffyChrome.tsx` — shell del storefront (announcement
    bar, navbar, footer, cart drawer, product modal) sobre el router real.
  - `*PageClient.tsx` — wrappers cliente de cada página.
  - `checkout-actions.ts` — inicia el pago real (TUU u hosted checkout de
    Shopify) con email de invitado para OLFFY Puntos.
  - `marketing-actions.ts` — newsletter (outbox → Klaviyo vía cron) y
    formulario de contacto (tabla `contact_messages` en Supabase).

## Rutas conectadas

| Ruta                             | Datos                                                   |
| -------------------------------- | ------------------------------------------------------- |
| `/`                              | Productos Shopify (más nuevos primero)                  |
| `/tienda` (+ `/tienda/[handle]`) | Catálogo + categorías desde tags                        |
| `/novedades`                     | Colecciones Shopify + productos con tag `Nuevo`         |
| `/regalos`                       | Productos tag `Especial`, categoría Regalos o ≤ $10.000 |
| `/contacto`                      | Form → `contact_messages` (Supabase)                    |
| `/checkout`                      | Carrito Shopify → pago TUU / checkout Shopify           |
| `/cuenta`                        | OLFFY Puntos (Supabase) — diseño anterior, funcional    |

Badges de producto vía tags de Shopify: `nuevo`/`new`, `favorito`,
`especial`; el primer tag "normal" se usa como categoría.

## Requisitos de entorno

- `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) para newsletter y
  contacto.
- `MARKETING_PROVIDER=klaviyo` + credenciales Klaviyo para que el cron
  `/api/cron/marketing/process-events` envíe los eventos.
- Migración `20260703120000_add_contact_messages.sql` aplicada
  (`supabase db push` o SQL editor).
