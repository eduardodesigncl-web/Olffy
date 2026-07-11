# Baseline — Plan maestro OLFFY (10 de julio de 2026)

Línea base del entorno aislado sobre la rama `codex/integrar-frontend-claude`
antes de implementar el plan maestro. GitHub solo se usa como referencia: no
hay merges, pushes ni PRs en esta etapa.

## Validaciones base

| Paso               | Resultado                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `vitest run`       | 5/5 pruebas pasan (3 archivos)                                                                                       |
| `tsc --noEmit`     | Sin errores                                                                                                          |
| `prettier --check` | 443 archivos con formato inconsistente (preexistente) → normalizados con `prettier --write`, solo cambios de formato |
| `next build`       | Compila sin errores                                                                                                  |

Variables presentes en `.env.local` (solo nombres): ADMIN*PASSWORD,
ADMIN_SESSION_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY,
SUPABASE_SERVICE_ROLE_KEY, SHOPIFY*\* (admin/storefront/webhook), COMPANY_NAME,
SITE_NAME. **No hay credenciales TUU ni Klaviyo**: `TUU_REMOTE_POS_ENABLED`
permanece desactivado y el proveedor de marketing queda en `noop`.

## Clasificación por área

### Implementado (reutilizar, no duplicar)

- **Cobro remoto TUU**: `app/api/admin/loyalty/sales/remote-payment/route.ts`
  (claim idempotente por `payment_reference`, snapshot del carrito,
  fingerprint) + `app/api/payments/tuu/pos/webhook/route.ts` (secreto con
  `timingSafeEqual`, normalización de estados, validación de monto,
  `reconciliation_required`, finalización idempotente).
- **Pipeline de venta física**: `lib/loyalty/physical-pos.ts`
  (`preparePhysicalSale` revalida stock/precios/estado en Shopify,
  `finalizePreparedPhysicalSale` crea orden pagada `createOrFindPaidPhysicalOrder`
  con metafields TUU y liquida puntos vía RPC).
- **Ledger de puntos**: `lib/loyalty/service.ts` + RPC
  `register_physical_sale`; movimientos en `loyalty_transactions`, sin saldo
  editable.
- **Ventas digitales**: webhook `orders-paid` con HMAC + backfill cron
  `sync-paid-orders`; `lib/admin/digital-sales.ts`.
- **Pipeline transaccional**: `lib/transactions/*` (orchestrator, repository,
  DTE noop/OpenFactura, marketing noop/Klaviyo) y vista `/admin/operaciones`
  con reintento de boleta.
- **Canjes Shopify**: `lib/loyalty/redemptions.ts` + `lib/shopify/discounts.ts`.
- **Auth admin**: cookie firmada con `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`
  (`lib/admin/session.ts`). Sin recuperación real de contraseña.

### Parcial (conectar/corregir)

- **Dashboard SPA** (`src/admin-panel/*`): `/admin` renderiza `AdminPage` con
  `@ts-nocheck`; los datos reales de `get-admin-panel-data.ts` se **hidratan
  mutando arreglos mock** (`hydrate-admin-panel-data.ts`). Navegación por tabs
  locales: separa "Ventas" (físicas) y "Ventas digitales".
- **POS visible** (`AdminPhysicalSales.tsx`): usa regla hardcodeada
  `$1.000 = 10 pts`, referencia `manual-${Date.now()}` y
  `paymentConfirmed: true` desde el frontend. El POS routed
  (`app/admin/puntos/ventas` + `components/admin/loyalty-pos.tsx`) sí llama al
  endpoint remoto pero mantiene además el bypass manual.
- **Navegación duplicada**: conviven la SPA (`/admin`) y las páginas routed
  con `AdminShell` (`/admin/puntos`, `/admin/ventas-digitales`,
  `/admin/operaciones`, `/admin/productos`, `/admin/colecciones`).

### Mock/demo (eliminar o conectar)

- `AdminPointRulesSettings` / `AdminPointsRules` (regla demo $1.000=10),
  `AdminPasswordSettings`, `AdminTeamSettings`, `AdminSettings`,
  `AdminCustomerDetail` (canje/reversa "en modo demo"),
  `AdminDigitalSales`/`AdminProducts` ("sincronizado en modo demo"),
  `AdminPointsAdjustmentMock`, `AdminRewardFormMock`, `AdminSaleHistoryMock`,
  `AdminSaleSuccessMock`, `AdminAbandonedCarts` (datos mock).

### Pendiente (no existe)

- `pending_claim` de compra invitada (15 días) — sin tabla ni flujo.
- Versionado de reglas (`valid_from`, snapshot por movimiento). `loyalty_rules`
  existe con seed `$1.000 = 10 pts` y única fila activa.
- Exclusión de productos por marcador Shopify ("Sin puntos").
- Expiración de puntos por lote (6 meses) — hay `points_expiry_months` en la
  regla pero sin job/cálculo aplicado.
- Correos de fidelización (invitación, recordatorio, activación).
- Recuperación de contraseña admin con proveedor real.
- Métricas de carrito abandonado reales.

### Bloqueado por acceso externo

- Credenciales TUU/Haulmer (API key, device UUID/serial, secreto webhook) —
  QA sandbox del cobro remoto queda pendiente; el flag permanece `false`.
- Klaviyo (sin contrato) — provider `noop`.
- Certificación DTE/OpenFactura.
- Supabase: sin CLI vinculado en este entorno; las migraciones nuevas quedan
  versionadas en `supabase/migrations/` para aplicarse con
  `supabase db push` o desde el dashboard.

## Bloqueo detectado durante la ejecución (10-jul-2026)

- **SHOPIFY_ADMIN_API_ACCESS_TOKEN inválido (401)**: verificado directamente
  contra `https://f46f6e-a4.myshopify.com/admin/api/2024-10/shop.json`. El
  Storefront API funciona (la tienda pública carga productos), pero el Admin
  API rechaza el token. Afecta: catálogo del POS, /admin/productos,
  /admin/colecciones y la creación de órdenes físicas. Acción del responsable:
  regenerar el token de la app privada en Shopify Admin (o `vercel env pull`
  si ya fue rotado en Vercel) y actualizar `.env.local`.
