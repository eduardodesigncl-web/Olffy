# Flujo transaccional de producción OLFFY

## Activación segura

1. Aplicar la migración `20260620120000_add_production_transaction_pipeline`.
2. Configurar secretos de Supabase, Shopify y `ADMIN_SESSION_SECRET`.
3. Mantener `DTE_PROVIDER=noop`, `MARKETING_PROVIDER=noop` y
   `PAYMENTS_TUU_ENABLED=false` durante la primera validación.
4. Probar una venta física y confirmar su aparición en
   `/admin/operaciones`.
5. Configurar TUU sandbox y habilitar `PAYMENTS_TUU_ENABLED=true`.
6. Configurar `CRON_SECRET` en Vercel. El cron diario definido en
   `vercel.json` enviará automáticamente ese valor como Bearer token.
7. Activar proveedores reales solo después de validar idempotencia y
   conciliación.

## Contrato genérico TUU

La integración usa `POST {TUU_ONLINE_API_URL}/payments`, HMAC SHA-256 sobre
`timestamp.payload_canonico` y los headers `X-TUU-Timestamp` y
`X-TUU-Signature`. El callback debe entregar referencia OLFFY, referencia de
pago, monto entero CLP, estado y firma.

Antes de conectar producción, ajustar nombres de campos o endpoints al contrato
oficial entregado por TUU. La lógica de negocio, idempotencia y validación de
monto permanece encapsulada en `lib/tuu`.

## Recuperación

- Un callback repetido devuelve la operación existente.
- Un monto o moneda distintos dejan el pago en `manual_review`.
- Una orden Shopify creada se recupera por tag OLFFY.
- Una boleta se identifica por `dte:{shopify_order_id}`.
- Los fallos DTE se reintentan desde `/admin/operaciones`.
- Marketing se procesa por lotes desde la ruta cron y conserva errores.

## Datos no almacenados

No se guardan PAN, CVV, PIN, XML/PDF tributarios, HTML de email, aperturas ni
clics. Solo se conservan referencias, URLs privadas y payloads mínimos.
