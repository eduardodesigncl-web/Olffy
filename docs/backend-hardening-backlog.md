# Backlog de hardening backend de OLFFY

Pendientes técnicos deliberadamente fuera de este bloque. Las estimaciones son
orientativas para una persona familiarizada con el repositorio e incluyen
implementación y pruebas, pero no tiempos de espera por accesos externos.

## Criterios de prioridad

- **P1:** riesgo de seguridad, dinero, saldo, operación o soporte que debe
  resolverse antes de ampliar uso real.
- **P2:** deuda de escalabilidad, compatibilidad o experiencia que debe
  planificarse después de estabilizar producción.

## P1

### Admin login sin rate limiting

- **Prioridad:** P1.
- **Impacto:** protege el único acceso al panel contra intentos automatizados.
- **Riesgo:** fuerza bruta sobre contraseña compartida y consumo innecesario de
  funciones.
- **Esfuerzo estimado:** medio, 1-2 días.
- **Archivos probables:** `app/api/admin/auth/route.ts`,
  `app/admin/login/page.tsx`, `proxy.ts` y un adaptador de almacenamiento.
- **Recomendación de implementación:** rate limit por IP y huella de sesión con
  ventana deslizante, respuesta 429, `Retry-After`, logging sin contraseña y
  límites diferenciados por entorno. Preferir almacenamiento compartido
  administrado; no usar memoria local de una función serverless.
- **Requiere acceso externo:** sí para configurar almacenamiento compartido y
  validar comportamiento en Vercel; la abstracción y pruebas locales no.

### Admin con contraseña compartida; futuro roles reales

- **Prioridad:** P1.
- **Impacto:** permite identidad individual, revocación, mínimo privilegio y
  auditoría confiable.
- **Riesgo:** cualquier persona con la contraseña tiene acceso total; las
  acciones registran texto libre como responsable.
- **Esfuerzo estimado:** alto, 4-8 días.
- **Archivos probables:** `lib/admin/auth.ts`, `lib/admin/session.ts`,
  `lib/admin/api-auth.ts`, `proxy.ts`, layouts admin, acciones de puntos y APIs
  `/api/admin/*`.
- **Recomendación de implementación:** proveedor de identidad o Supabase Auth
  separado por claims/tabla de roles; roles mínimos `owner`, `catalog`,
  `loyalty` y `pos`; sesión con user ID; autorización por acción y auditoría
  server-side.
- **Requiere acceso externo:** sí para configurar proveedor, usuarios, secretos
  y callbacks.

### Vencimientos de canjes sin cron automático

- **Prioridad:** P1.
- **Impacto:** devuelve puntos y desactiva/conciliará descuentos vencidos sin
  depender de intervención manual.
- **Riesgo:** estados aprobados vencidos, puntos retenidos y descuentos con
  estado divergente.
- **Esfuerzo estimado:** medio-alto, 2-4 días.
- **Archivos probables:** `lib/loyalty/redemptions.ts`,
  `lib/loyalty/service.ts`, nueva ruta de job, `vercel.json` o scheduler
  equivalente y migraciones futuras.
- **Recomendación de implementación:** job idempotente por lotes que reclame
  registros vencidos, consulte uso Shopify, desactive cuando corresponda y
  complete expiración/reembolso mediante RPC. Registrar cada intento y permitir
  reejecución.
- **Requiere acceso externo:** sí para Shopify, Supabase producción y scheduler
  de Vercel.

### Conciliación de uso Shopify eventualmente consistente

- **Prioridad:** P1.
- **Impacto:** evita devolver puntos de descuentos usados y reduce trabajo
  manual.
- **Riesgo:** Shopify puede reflejar uso después de la acción local; una lectura
  puntual puede concluir incorrectamente que no se usó.
- **Esfuerzo estimado:** alto, 4-7 días.
- **Archivos probables:** `lib/shopify/discounts.ts`,
  `lib/loyalty/redemptions.ts`, `lib/loyalty/service.ts`, job de conciliación y
  vista admin de excepciones.
- **Recomendación de implementación:** estado explícito de chequeo, reintentos
  con backoff, ventana de seguridad posterior al vencimiento, registro de
  `usageCount` y transición a `reconciliation_required` al agotar intentos.
  Evaluar webhook/evento si Shopify ofrece señal fiable para este tipo.
- **Requiere acceso externo:** sí para probar comportamiento real y latencias de
  Shopify.

### Códigos compartibles sin Shopify Customer GID confiable

- **Prioridad:** P1.
- **Impacto:** limita que un código emitido para un cliente sea usado por otra
  persona.
- **Riesgo:** cuando falta `shopify_customer_id`, el descuento se crea para
  todos los clientes y el código puede compartirse.
- **Esfuerzo estimado:** alto, 4-8 días según estrategia de identidad.
- **Archivos probables:** `lib/customer/auth.ts`, `lib/loyalty/service.ts`,
  `lib/shopify/discounts.ts`, flujos de vinculación y panel de cliente/admin.
- **Recomendación de implementación:** completar una vinculación verificable
  entre cuenta OLFFY y Shopify Customer antes de emitir beneficios restringidos.
  Si no existe GID, bloquear aprobación o usar un mecanismo de beneficio
  aplicado en checkout autenticado; no confiar solo en códigos aleatorios.
- **Requiere acceso externo:** sí para Shopify Customers, scopes, checkout y
  pruebas de identidad.

## P2

### Shopify `productCreate`/`productUpdate` deprecados

- **Prioridad:** P2.
- **Impacto:** mantiene compatibilidad del CRUD con versiones futuras de Admin
  GraphQL.
- **Riesgo:** warnings actuales pueden convertirse en ruptura al actualizar la
  versión API.
- **Esfuerzo estimado:** medio-alto, 2-5 días.
- **Archivos probables:** `lib/shopify/admin.ts`,
  `app/api/admin/products/route.ts`,
  `app/api/admin/products/[id]/route.ts` y formularios admin.
- **Recomendación de implementación:** migrar al flujo vigente recomendado por
  Shopify para producto, variantes y medios; tipar inputs/respuestas y conservar
  `userErrors` por campo.
- **Requiere acceso externo:** sí para validar contra una tienda de desarrollo;
  el refactor base puede prepararse localmente.

### Creación de producto puede fallar por inventario/`locationId`

- **Prioridad:** P2.
- **Impacto:** hace confiable la creación de producto con stock inicial.
- **Riesgo:** `inventoryQuantities` sin ubicación puede ser rechazado o dejar
  inventario inesperado.
- **Esfuerzo estimado:** medio, 2-3 días.
- **Archivos probables:** `components/admin/product-form.tsx`,
  `lib/shopify/admin.ts` y `/api/admin/products`.
- **Recomendación de implementación:** consultar ubicaciones activas, exigir o
  seleccionar `locationId`, separar creación de producto/variante de activación
  de inventario y presentar errores específicos.
- **Requiere acceso externo:** sí para locations y pruebas Admin API.

### Admin catálogo limitado a 50 productos

- **Prioridad:** P2.
- **Impacto:** permite operar catálogos que superen el primer lote.
- **Riesgo:** productos invisibles para el administrador y falsa impresión de
  catálogo completo.
- **Esfuerzo estimado:** medio, 1-3 días.
- **Archivos probables:** `lib/shopify/admin.ts`,
  `lib/shopify/admin-types.ts`, `app/admin/productos/page.tsx` y componentes de
  paginación.
- **Recomendación de implementación:** exponer `pageInfo` y cursores, paginación
  siguiente/anterior, búsqueda server-side y conteo o indicador de resultados.
- **Requiere acceso externo:** no para implementar; sí para probar con más de 50
  productos reales.

### Variantes limitadas a 10

- **Prioridad:** P2.
- **Impacto:** evita editar o calcular inventario sobre una vista incompleta del
  producto.
- **Riesgo:** stock y variantes posteriores a la décima quedan ocultos.
- **Esfuerzo estimado:** medio, 2-4 días.
- **Archivos probables:** queries de `lib/shopify/admin.ts`,
  `lib/shopify/admin-types.ts`, detalle/formulario de producto.
- **Recomendación de implementación:** conexión paginada de variantes o
  endpoint específico; presentar opciones y stock por variante, no solo la
  primera.
- **Requiere acceso externo:** no para implementar; sí para fixture real con
  más de 10 variantes.

### Carrito no muestra `userErrors`/warnings Shopify claramente

- **Prioridad:** P2.
- **Impacto:** informa al usuario por qué cambió cantidad, precio o
  disponibilidad.
- **Riesgo:** mensajes genéricos, estado visual desincronizado y abandono de
  checkout.
- **Esfuerzo estimado:** medio, 2-4 días.
- **Archivos probables:** `lib/shopify/mutations/cart.ts`,
  `lib/shopify/types.ts`, `lib/shopify/index.ts`,
  `components/cart/actions.ts` y componentes de carrito.
- **Recomendación de implementación:** solicitar `userErrors` y warnings en
  mutaciones, normalizar un resultado tipado por línea/global y mostrar mensajes
  localizados sin perder el carrito actualizado.
- **Requiere acceso externo:** no para el contrato y pruebas; sí para reproducir
  casos Shopify reales.

### Redirect legacy `/product/[handle]` debería ser 301

- **Prioridad:** P2.
- **Impacto:** consolida señales SEO en `/producto/[handle]`.
- **Riesgo:** `redirect()` emite redirect temporal y prolonga la coexistencia de
  URL legacy.
- **Esfuerzo estimado:** bajo, menos de 1 día.
- **Archivos probables:** `next.config.ts` o `proxy.ts`; luego retirar o
  simplificar `app/product/[handle]/page.tsx`.
- **Recomendación de implementación:** redirect permanente parametrizado,
  conservar query string si aplica y verificar status/canonical/sitemap.
- **Requiere acceso externo:** no para implementar; recomendable verificar el
  status en Preview/Vercel.

## Orden sugerido

1. Rate limiting e identidad/roles admin.
2. Automatización de vencimientos y conciliación.
3. Restricción fiable de descuentos por cliente.
4. Migración del CRUD Shopify y corrección de inventario/location.
5. Paginación de productos y variantes.
6. Errores detallados de carrito.
7. Redirect permanente legacy.

## Condición de cierre de cada ítem

- Pruebas automatizadas para reglas puras y transiciones.
- `npm run build:check` aprobado.
- Runbook o nota operativa cuando intervengan credenciales/jobs.
- QA en entorno no productivo para integraciones externas.
- Métricas/logs suficientes para detectar reintentos, bloqueos y estados
  irreconciliables.
