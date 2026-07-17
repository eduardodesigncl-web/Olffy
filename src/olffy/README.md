# Frontend oficial OLFFY (src/olffy)

Port del frontend oficial (`olffy-react-front`, versión 15-jul-2026) al App
Router de Next.js, conectado al backend real (Shopify + Supabase + TUU). La UI
(components/, pages/, styles/) se mantiene 1:1 con el handoff; la carpeta
`integration/` es la única capa que conoce el backend.

## Estructura

- `components/`, `pages/`, `styles/`, `types/`, `data/` — código del frontend
  oficial (CSS Modules + tokens). `types/Product` se extendió con `handle`,
  `image`, `hoverImage`, `images`, `variantId` y `availableForSale` (Shopify).
- `context/CartContext.tsx` — carrito respaldado por el carrito real de
  Shopify: se hidrata en el cliente después del primer pintado
  (`getCartItemsAction`), con estado optimista local y reconciliación por
  server actions. Ninguna página bloquea su render esperando a Shopify.
- `integration/`
  - `mappers.ts` — Shopify Storefront → tipos del frontend (galería completa
    de imágenes incluida).
  - `account-mappers.ts` — Supabase (cuenta, movimientos, recompensas,
    canjes, regla activa) → tipos del panel de cliente.
  - `shell.tsx` + `OlffyChrome.tsx` — chrome del storefront (announcement
    bar, navbar, footer, cart drawer) sobre el router real. El detalle de
    producto ya no es modal: `useOpenProduct` navega a `/tienda/[handle]`.
  - `*PageClient.tsx` — wrappers cliente de cada página.
  - `checkout-actions.ts` — sesión/canjes OLFFY Puntos en el carrito e inicio
    del pago real (TUU u hosted checkout de Shopify).
  - `account-actions.ts` — canje de recompensas, actualización de perfil y
    cambio de contraseña con sesión activa.
  - `PuntosAuthCard.tsx` / `PuntosLanding.tsx` / `ResetPasswordCard.tsx` —
    login/registro/recuperación reales (Supabase Auth) con el diseño del
    Club OLFFY.
  - `PuntosPanelClient.tsx` — panel de cliente (tabs resumen/historial/
    recompensas/canjes/configuración/reglas) con datos reales.
  - `marketing-actions.ts` — newsletter (outbox → Klaviyo vía cron) y
    formulario de contacto (tabla `contact_messages` en Supabase).

## Rutas conectadas

| Ruta                             | Datos                                                     |
| -------------------------------- | --------------------------------------------------------- |
| `/`                              | Productos Shopify (más nuevos primero)                    |
| `/tienda`                        | Catálogo + categorías desde tags + stock real             |
| `/tienda/[handle]`               | Detalle con galería real, relacionados y stock            |
| `/novedades`                     | Productos con tag `Nuevo` + aviso por correo (newsletter) |
| `/regalos`                       | Selección de regalos + quiz sobre el catálogo real        |
| `/nuestra-historia`              | HistoriaPage del frontend oficial                         |
| `/contacto`                      | Form → `contact_messages` (Supabase) + FAQ                |
| `/checkout`                      | Redirige al carrito (pre-checkout) → pago TUU/Shopify     |
| `/cuenta/login`                  | Club OLFFY: login/registro/recuperación (Supabase Auth)   |
| `/cuenta`                        | Panel cliente: puntos, pedidos (Shopify), canjes, reglas  |
| `/cuenta/{canjes,historial,recompensas}` | Redirigen a la pestaña correspondiente de `/cuenta` |
| `/cuenta/restablecer`            | Nueva contraseña desde enlace de recuperación             |

Categorías y badges desde **colecciones de Shopify**: la primera colección
"normal" del producto es su categoría (Cuadernos, Libretas, Planners,
Stickers, Tacos de Notas, FlashCards, Marcapáginas, Empaque…); la colección
`Novedades!` marca el badge `Nuevo` (y alimenta /novedades). Tags quedan como
respaldo (`favorito`, `especial`). Sin stock ⇒ `Agotado` (botón deshabilitado
y excluido de destacados).

El detalle de producto parsea `descriptionHtml`: intro corta bajo el precio,
specs "Etiqueta: valor" (Tamaño, Cantidad, Gramaje, Formato…) en la grilla,
descripción completa en el acordeón, y el visor "Mira su interior" se arma
según la categoría real y el contenido descrito (plan mensual, hoja
cuadriculada/punteada, stickers, notas, ilustración).

## Requisitos de entorno

- `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) para cuenta de
  cliente, newsletter y contacto.
- Credenciales Shopify Admin para enriquecer "Mis pedidos" (estado logístico,
  líneas y tracking); si faltan, el panel degrada a la información local.
- `MARKETING_PROVIDER=klaviyo` + credenciales Klaviyo para que el cron
  `/api/cron/marketing/process-events` envíe los eventos.
