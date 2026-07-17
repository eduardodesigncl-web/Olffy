# Entrega — Plan maestro OLFFY (ejecución del 10-jul-2026)

Trabajo realizado en el entorno aislado sobre la copia local. **No se hizo
ningún commit, push, merge ni PR a GitHub** (los cambios están en el working
tree; el responsable decide qué se integra). Complementa a
[baseline-plan-maestro.md](baseline-plan-maestro.md).

## Qué se implementó

### Ventas unificadas (Sprints 1 y 3)

- Nueva sección **Ventas** (`/admin/ventas`) con pestañas **Ventas del día** e
  **Historial de ventas**, que unifica ventas online y físicas desde
  `olffy_order_refs` (ambos canales) con etiqueta de origen, filtros por
  origen/estado/búsqueda y métricas del período. Pestaña y filtros persisten
  en la URL (`?vista=&origen=&q=`), zona horaria America/Santiago.
  - `src/admin-panel/components/admin/AdminSales.tsx` (+ módulo CSS)
  - `src/admin-panel/components/admin/AdminSaleDetailDrawer.tsx`: detalle con
    orden Shopify (enlace directo), método/estado de pago, referencia TUU,
    boleta, puntos y canal.
- Navegación consolidada: el sidebar quedó **Dashboard · Ventas · Tienda POS ·
  Clientes · Puntos · Recompensas · Productos · Colecciones · Ajustes**. Se
  eliminaron las secciones competitivas "Ventas físicas" y "Ventas digitales".
- URL por pestaña (`/admin/ventas`, `/admin/pos`, `/admin?tab=...`).
  Redirecciones: `/admin/ventas-digitales` → `/admin/ventas?origen=online`,
  `/admin/puntos/ventas` → `/admin/pos`.
- Eliminado código muerto: árbol legado `src/components/admin/*` (no
  importado por nadie), `components/admin/loyalty-pos.tsx`, y los componentes
  mock de ventas (`AdminPhysicalSales`, `AdminDigitalSales`,
  `AdminSaleSuccessMock`, `AdminSaleHistoryMock`, `AdminSalesDayDetail`, etc.).

### Tienda POS (Sprint 6)

- Nueva **Tienda POS** (`/admin/pos`) inspirada en Shopify POS según las
  referencias entregadas: superficie oscura, búsqueda arriba, grilla de tiles
  de producto (imagen, stock, precio) + tiles de acción ("Agregar cliente",
  "Aplicar descuento"), panel derecho con la venta en curso (cliente o venta
  anónima, líneas con steppers, subtotal/descuento/puntos) y botón azul
  **Cobrar con TUU $X**. `src/admin-panel/components/admin/AdminPos.tsx`.
- El cobro usa exclusivamente el backend remoto existente:
  `POST /api/admin/loyalty/sales/remote-payment` + polling del estado hasta el
  webhook TUU. Estados visibles: enviando, esperando TUU, aprobado (pantalla
  de venta completada con orden Shopify, registro y referencia), rechazado y
  conciliación requerida (con indicación de recuperar desde Operaciones sin
  volver a cobrar).
- **Eliminados los bypass**: ya no existe `manual-${Date.now()}`,
  `paymentConfirmed: true` desde el frontend ni la acción `registerTuuSale`
  del adaptador (creaba ventas pagadas sin confirmación de TUU). El endpoint
  manual `/api/admin/loyalty/sales` se conserva solo para recuperación.
- Selección de variantes para productos multi-variante, límite por stock,
  puntos calculados con la regla activa de Supabase (no hardcodeados);
  el servidor revalida precios/stock/regla en `preparePhysicalSale`.

### Reglas de puntos versionadas (Sprint 5)

- Migración `supabase/migrations/20260710130000_versioned_loyalty_rules.sql`
  (**pendiente de aplicar** — ver bloqueos):
  - `loyalty_rules`: columnas `valid_from`, `created_by`, `notes`.
  - Nueva regla activa **$200 CLP = 1 punto**, expiración 6 meses, canje
    $10/punto; la regla anterior queda inactiva como historial. Auditada.
  - Recompensas 300/500/1000 pts con mínimos $20.000/$30.000/$60.000.
  - `loyalty_transactions.rule_id` + trigger que sella cada movimiento
    earned/redeemed con la versión de regla y su snapshot (no retroactivo).
  - RPC `publish_loyalty_rule` (valida, desactiva la anterior, inserta nueva
    versión con `valid_from` y registra `audit_log`). Sin grants a anon.
- Pantalla **Ajustes → Puntos** conectada a Supabase vía
  `/api/admin/loyalty/rules` (GET regla activa + historial, POST publicar
  versión): previsualización de ejemplo, advertencia de no retroactividad,
  historial de versiones. Eliminado el modo demo y la regla local $1.000=10.
  Tolerante al esquema pre-migración (usa `created_at` si no hay `valid_from`).
- "Reglas del programa" (pestaña Puntos) ahora deriva de la regla vigente.

### Clientes, puntos y auditoría (Sprint 4, parcial)

- **Ajuste manual real** en la pestaña Puntos
  (`AdminPointsAdjustment.tsx`): llama a `adjustCustomerPoints` (RPC con
  motivo/responsable obligatorios, movimiento en ledger + audit_log). Sustituye
  a `AdminPointsAdjustmentMock`.
- **Crear canje real** desde el detalle de cliente: usa las recompensas
  activas reales y la acción `createRedemption` (nueva en
  `/api/adapters/admin-actions`, RPC `redeem_loyalty_reward` con reserva de
  puntos). Aprobar/cancelar canje ya llamaban al backend real.
- **Nueva recompensa real** (`AdminRewardForm.tsx` +
  `/api/admin/loyalty/rewards`): persiste en `rewards` con monto, mínimo de
  compra y vigencia. Sustituye a `AdminRewardFormMock`.
- La reversa por fila del historial (demo) se retiró; las correcciones se
  hacen con el ajuste manual auditado.

### Dashboard y honestidad de datos (Sprint 2 + criterios de salida)

- KPI "Ventas del día" ahora suma online + físicas pagadas del día (Chile TZ)
  con desglose por origen; actividad reciente usa ventas y movimientos reales
  con fecha; las métricas cliqueables navegan a la sección filtrada.
- **Carritos abandonados**: `lib/shopify/abandoned-checkouts.ts` consulta los
  checkouts abandonados nativos de Shopify (Admin GraphQL). Si la fuente no
  está disponible se muestra un estado explícito, nunca datos inventados.
  El dashboard indica fuente y hora de actualización.
- **Datos falsos eliminados**: los contenedores mock
  (`adminData.mock.ts`, `products.mock.ts`, `adminDigitalSales.mock.ts`,
  `adminCustomerPayments.mock.ts`) nacen vacíos; si la hidratación falla se
  ven estados vacíos, no clientes/ventas inventados.
- Pantallas sin simulación: contraseña admin (explica ADMIN_PASSWORD y
  declara la recuperación como pendiente), información de tienda
  (informativa), equipo/responsables y "destacados" persisten en el
  dispositivo con etiqueta explícita, "sincronizar" productos hace un
  `router.refresh()` real del catálogo.

## Validaciones

- `vitest run` 5/5 · `tsc --noEmit` sin errores · `prettier --check` limpio ·
  `next build` compila (ver resultado de `npm run build:check` al cierre).
- Verificación en navegador (dev server local): login, Ventas (día e
  historial con ventas reales de ambos orígenes), Tienda POS (layout y
  estados), Ajustes→Puntos (regla real desde Supabase), dashboard con KPIs
  reales y estado honesto de carritos abandonados.

## Bloqueos externos (acción del responsable)

1. **SHOPIFY_ADMIN_API_ACCESS_TOKEN inválido (401)** — verificado contra la
   API. Regenerar el token para `f46f6e-a4.myshopify.com` (o `vercel env pull`
   si ya se rotó). Sin él no cargan catálogo del POS, productos, colecciones,
   carritos abandonados ni se pueden crear órdenes físicas.
2. **Migración Supabase sin aplicar** — el CLI no está autenticado
   (`SUPABASE_ACCESS_TOKEN` ausente). Aplicar
   `20260710130000_versioned_loyalty_rules.sql` con `supabase link` +
   `supabase db push` o desde el SQL editor del dashboard. Hasta entonces la
   regla activa sigue siendo $1.000=10 y publicar versiones desde el panel
   fallará (falta la RPC).
3. **TUU/Haulmer** — sin credenciales en el entorno; `TUU_REMOTE_POS_ENABLED`
   sigue desactivado. QA sandbox del cobro remoto pendiente (S6-02).
4. **Klaviyo** — sin contrato; proveedor `noop` operativo.

## Pendientes de implementación (fuera de esta entrega)

- `pending_claim` de compra invitada (15 días) + correo de invitación (S4-03,
  S7): requiere migración nueva y flujo de verificación de cuenta.
- Exclusión de productos por marcador Shopify "Sin puntos" y cálculo de
  carrito mixto (S5-02): bloqueado en la práctica por el token Admin 401.
- Expiración de puntos por lote a 6 meses (job/cron) — la regla ya lo declara.
- Migración del login admin a Supabase Auth con recovery link a
  gabri.dayan16@gmail.com (S1-03) — documentado como pendiente, sin simular.
- Correos de fidelización por eventos (S7-02) sobre el adaptador existente.
- Reversas automáticas por devolución/reembolso Shopify (S5-04).

## Segunda iteración (11-jul-2026) — Propuesta OLFFY Puntos v2 aplicada

El informe "OLFFY_propuesta_sistema_puntos_2025_2026_v2" confirma la base ya
implementada ($200 = 1 punto, canjes 300/500/1000 con mínimos, 6 meses) y se
aplicaron sus tres piezas restantes:

### Exclusión "Sin puntos" + carrito mixto (S5-02)

- `lib/loyalty/eligibility.ts`: categoría de exclusión configurable con
  `LOYALTY_EXCLUSION_TAG` (default **"Sin puntos"**, el nombre recomendado del
  informe; se compara sin distinguir mayúsculas). Helpers para marcar
  productos excluidos y repartir descuentos proporcionalmente.
- **POS** (`preparePhysicalSale`): calcula `eligibleSubtotal`/`eligibleTotal`
  (solo productos participantes), los puntos se acumulan sobre el monto
  elegible, el descuento por puntos no puede superar el subtotal elegible y
  cada línea marca si está excluida. La Tienda POS muestra la etiqueta
  "Sin puntos" en tiles y líneas, y una fila "Productos sin puntos" en el
  resumen cuando el carrito es mixto.
- **Online** (`lib/admin/digital-sales.ts`): el webhook usa las líneas del
  payload + consulta de tags, y el cron trae líneas con tags en la misma
  query GraphQL. Base de puntos = subtotal pagado (después de descuentos,
  sin envío) escalado por la fracción elegible; queda en metadata
  (`eligible_total`, `excluded_amount`). Si Shopify no responde los tags, la
  acreditación queda `failed`/reintentable en vez de acreditar de más.
- Migración `20260711120000_eligible_total_physical_sale.sql`: la RPC
  `finalize_physical_sale_pos` acepta `p_eligible_total` y valida los puntos
  contra el monto elegible (compatibilidad con la firma antigua cuando toda
  la venta es elegible).

### Expiración de puntos por lote (6 meses, FIFO)

- Migración `20260711130000_loyalty_points_expiration.sql`:
  - `loyalty_transactions.expires_at` por lote (backfill según la regla que
    generó cada lote) y sellado automático en el trigger de reglas.
  - `loyalty_lot_remaining()`: remanente por lote bajo consumo FIFO (se
    descuentan primero los puntos más antiguos).
  - `expire_loyalty_points()`: expira solo el remanente vencido, inserta el
    movimiento `expired` (historial intacto) con auditoría; protegido con
    advisory lock e idempotente por recomputación.
  - `get_expiring_loyalty_points()`: puntos próximos a vencer.
- Cron `app/api/cron/loyalty/expire-points` (Bearer CRON_SECRET) registrado
  en `vercel.json` (11:00 UTC diario).
- La cuenta del cliente (`/cuenta`) muestra un aviso con los puntos que
  vencen en los próximos 30 días y su fecha.

### Reclamación de puntos por compra invitada (S4-03, 15 días)

- Migración `20260711140000_guest_pending_claims.sql`: tabla
  `loyalty_pending_claims` (única por orden), RPC
  `claim_guest_loyalty_points` (activa reclamaciones vigentes al verificar la
  cuenta con el mismo correo, acredita con **fecha original de compra** para
  conservar el vencimiento del lote, idempotente con el flujo online) y
  `expire_guest_loyalty_claims` (15 días).
- Una orden pagada de invitado con correo crea la reclamación con los puntos
  del monto elegible y registra el evento `guest_points_invitation` en
  `email_events` (el envío real depende del proveedor de correo, aún noop).
- `completeVerifiedCustomerAccount` reclama automáticamente al vincular la
  cuenta verificada; la activación registra `guest_points_activated` y
  auditoría. El cron de expiración también vence reclamaciones.

### Migraciones pendientes de aplicar (junto a la de reglas)

1. `20260710130000_versioned_loyalty_rules.sql`
2. `20260711120000_eligible_total_physical_sale.sql`
3. `20260711130000_loyalty_points_expiration.sql`
4. `20260711140000_guest_pending_claims.sql`

Aplicar en ese orden con `supabase db push` o el SQL editor. Decisión de
negocio pendiente del informe: confirmar el nombre exacto de la categoría de
exclusión (hoy "Sin puntos" vía `LOYALTY_EXCLUSION_TAG`) y marcar en Shopify
los productos inicialmente excluidos, si los hay.

## Tercera iteración (11-jul-2026) — Reversas y correos de fidelización

### Reversas por devolución/anulación Shopify (S5-04)

- `lib/loyalty/reversals.ts`: reversa proporcional de puntos ganados según el
  monto reembolsado sobre el total pagado (anulación completa reversa todo el
  remanente). Idempotente por `refund_id`, considera devoluciones parciales
  sucesivas, nunca borra historial (movimiento `reversed` con motivo y
  vínculo al evento Shopify) y queda auditada. Si el cliente ya gastó parte
  del saldo, se reversa lo disponible y el faltante queda trazado en
  `audit_log`/metadata para revisión manual.
- Webhook `app/api/webhooks/shopify/refunds/route.ts` con verificación HMAC
  para los topics `refunds/create` y `orders/cancelled` (cubre ventas online
  y físicas: encuentra la transacción earned por orden en ambos canales).
- **Acción del responsable**: registrar en Shopify (Configuración →
  Notificaciones → Webhooks) los topics `refunds/create` y
  `orders/cancelled` apuntando a `/api/webhooks/shopify/refunds`.

### Correos de fidelización por eventos (S7-02)

Todos fluyen por el outbox transaccional existente
(`marketing_event_outbox` + cron `process-events`), idempotentes por evento y
desacoplados del proveedor (hoy `noop`; al configurar
`MARKETING_PROVIDER=klaviyo` con credenciales se envían sin cambiar lógica):

- `enqueueLoyaltyEmailEvent` en `lib/transactions/marketing.ts`: cola de
  correos del programa, sin depender del consentimiento de marketing por ser
  avisos operativos del beneficio del cliente.
- **Guest Points Invitation**: al crear la reclamación de compra invitada.
- **Guest Points Activated**: al activarse los puntos tras verificar cuenta.
- **Guest Claim Expiring Soon**: recordatorio cuando la reclamación vence en
  ≤3 días (cron diario).
- **Points Expiring Soon**: aviso por cliente cuando tiene puntos que vencen
  en ≤14 días, idempotente por fecha del lote más próximo (cron diario).

### Pendiente que se mantiene (decisión externa)

- Recuperación de contraseña admin con Supabase Auth: requiere configurar el
  proveedor de correo/redirects en Supabase y autorizar la migración del
  login; conforme al plan queda declarada pendiente, sin simulación.
- Restauración automática de puntos canjeados al anular un beneficio: la
  cancelación de canjes ya existe desde el panel (restaura puntos); su
  automatización por reembolso requiere definir cómo vincular refund ↔ canje.
