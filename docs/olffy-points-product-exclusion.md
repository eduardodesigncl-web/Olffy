# Exclusión de productos de OLFFY Puntos

## Fuente de verdad

La elegibilidad se obtiene exclusivamente del metafield de producto Shopify:

- Nombre: `Excluir del sistema de puntos`
- Namespace: `olffy`
- Key: `exclude_from_points`
- Tipo: `boolean`
- `true`: no acumula puntos.
- `false` o ausente: acumula puntos.

La definición se crea de forma idempotente desde el backend antes de la primera
escritura. Luego se guarda con `metafieldsSet` y se lee desde el producto padre
en consultas de productos y variantes. La colección “No acumula puntos” puede
usarse como vista comercial, pero no participa en el cálculo.

Scopes Shopify requeridos: `read_products`, `write_products`, `read_orders` y
`write_orders`. Los webhooks además requieren el secreto HMAC configurado en
`SHOPIFY_WEBHOOK_SECRET`.

## Flujo real encontrado

El storefront mantiene un carrito real de Shopify. Cuando
`PAYMENTS_TUU_ENABLED=true`, el backend valida carrito y regla, persiste un
snapshot en `payment_events` y crea una intención TUU online. Cuando está
deshabilitado —estado de la configuración local auditada— se redirige al
checkout alojado de Shopify. En ambos casos se calcula antes una estimación en
backend; no se confía en precios, elegibilidad ni puntos del navegador.

Para checkout Shopify, la acreditación definitiva comienza únicamente con un
`orders/paid` cuya firma HMAC sea válida. Se leen las líneas pagadas, se vuelve
a consultar el metafield cuando el payload no lo incluye, se distribuye el
descuento proporcionalmente y se guarda `olffy_order_refs.loyalty_snapshot`.
El cron `/api/cron/shopify/sync-paid-orders` reejecuta la misma función sobre
órdenes pagadas recientes. La restricción única por `shopify_order_id`, el
`idempotency_key` y la referencia única del ledger impiden duplicados entre
webhook, cron, callback TUU o reintento.

La pantalla de pago del storefront muestra la estimación. La confirmación
definitiva se ve en el detalle administrativo de OLFFY. La página “Thank you”
del checkout activo pertenece a Shopify y este repositorio no contiene una
Checkout UI Extension; para mostrar allí el desglose definitivo debe crearse y
publicarse una extensión `purchase.thank-you.block.render` y activarla en el
editor de checkout. No se reutiliza el componente `CheckoutSuccess` local,
porque actualmente es un mock sin ruta de retorno desde Shopify.

Para TUU online, el callback firmado compara monto y moneda con el snapshot. Una
diferencia deja `payment_events.status=manual_review` y no acredita puntos. Si
Shopify o Supabase fallan después del pago, el evento conserva el error y el
reintento reutiliza la orden por su referencia, sin volver a cobrar ni descontar
inventario. La referencia de puntos sigue siendo única por orden.

El POS revalida variante, producto padre, estado, stock, precio y metafield en
Shopify al preparar la venta y nuevamente antes de crear la orden pagada. Una
venta anónima se completa con cero puntos. El snapshot se guarda tanto en
`physical_sales` como en `olffy_order_refs`, y cada fila de
`physical_sale_items` conserva bruto, descuento, pagado, elegibilidad, monto
elegible y motivo.

## Cálculo y conservación histórica

La regla se lee desde la fila activa de `loyalty_rules`. El cálculo común usa:

`floor(monto_elegible / spending_unit_clp) * points_per_unit`

Los descuentos globales se asignan con mayores restos, por lo que la suma de los
descuentos por línea coincide exactamente con el descuento total. En canjes de
puntos, el descuento se asigna solo entre productos elegibles. El envío nunca
entra en las líneas de cálculo.

El snapshot guarda regla, versión `olffy-loyalty-v2`, montos y elegibilidad por
línea. Los reintentos usan el snapshot existente; cambiar posteriormente el
metafield o publicar otra regla no reescribe ventas históricas.

Las devoluciones buscan el snapshot original, calculan el monto elegible
devuelto por variante y cantidad, determinan los puntos que la compra debe
conservar con la regla histórica y reversan solo la diferencia. Una devolución
de una línea excluida produce cero reversa. `loyalty_refund_events` persiste
también devoluciones que todavía no cruzan un umbral de puntos, para acumularlas
en devoluciones sucesivas. La combinación orden/refund y la referencia
`loyalty-reversal:<order>:<refund>` hacen cada webhook idempotente.

## Matriz de pruebas de Preview

Aplicar primero la migración y desplegar a Preview con variables de Shopify,
Supabase, cron y secretos de webhook de Preview. Usar productos y clientes de
prueba, nunca pagos productivos.

|   # | Caso                            | Resultado esperado                                                        |
| --: | ------------------------------- | ------------------------------------------------------------------------- |
|   1 | Producto sin metafield          | Acumula; la lectura ausente equivale a `false`.                           |
|   2 | Metafield `false`               | Acumula.                                                                  |
|   3 | Metafield `true`                | Muestra “No acumula puntos” y monto elegible cero.                        |
|   4 | Carrito solo excluidos          | Cero puntos; todo el pagado queda excluido.                               |
|   5 | Carrito mixto                   | Solo suma líneas elegibles.                                               |
|   6 | Mixto con descuento global      | Descuento proporcional; totales de línea cuadran con el total.            |
|   7 | Regla 1 cada $200               | $10.000 elegibles generan 50 puntos.                                      |
|   8 | Nueva regla desde Ajustes       | Una venta nueva usa `spending_unit_clp` y `points_per_unit` nuevos.       |
|   9 | Venta antigua tras nueva regla  | Conserva regla, versión y puntos del snapshot original.                   |
|  10 | POS con cliente                 | Orden pagada, inventario, snapshot y puntos una vez.                      |
|  11 | POS sin cliente                 | Venta completa; cero puntos.                                              |
|  12 | Pago online aprobado            | Se acredita solo después de confirmación real.                            |
|  13 | Pago online rechazado           | No crea movimiento earned.                                                |
|  14 | Pago cancelado/abandonado       | No crea movimiento earned.                                                |
|  15 | Callback repetido               | Devuelve operación existente; no duplica orden ni puntos.                 |
|  16 | `orders/paid` repetido          | `already_processed`; un solo movimiento earned.                           |
|  17 | Callback y webhook misma orden  | La referencia Shopify existente evita doble procesamiento.                |
|  18 | Webhook atrasado + cron         | Cron crea/recupera una sola venta y un solo movimiento.                   |
|  19 | Monto pago distinto al snapshot | `manual_review`, sin puntos.                                              |
|  20 | Error Shopify postpago          | Evento visible con error; reintento no vuelve a cobrar.                   |
|  21 | Error Supabase postpago         | Reintento reutiliza la orden y ejecuta solo pasos pendientes.             |
|  22 | Cambiar metafield postcompra    | Detalle histórico y devolución usan elegibilidad original.                |
|  23 | Devolver producto elegible      | Recalcula puntos a conservar y reversa la diferencia.                     |
|  24 | Devolver producto excluido      | No reversa puntos.                                                        |
|  25 | Reintento manual                | No crea otra orden, no descuenta inventario otra vez y no duplica puntos. |

## Activación

1. Aplicar `supabase db push` al proyecto de Preview y verificar las columnas.
2. Desplegar la app Shopify de Preview para registrar `orders/paid`,
   `refunds/create` y `orders/cancelled` con `shopify app deploy`.
3. Reautorizar la app si se agregaron scopes en la instalación existente.
4. Si se exige el desglose dentro de la página “Thank you” alojada, generar una
   Checkout UI Extension `purchase.thank-you.block.render`, desplegarla y
   activarla en el editor de checkout de Preview.
5. Abrir crear/editar producto; guardar ambos valores y volver a cargar para
   comprobar lectura real desde Shopify.
6. Ejecutar la matriz anterior y revisar `payment_events`, `olffy_order_refs`,
   `physical_sales`, `physical_sale_items`, `loyalty_refund_events` y
   `loyalty_transactions`.
7. Confirmar que el cron de Preview lleva `Authorization: Bearer $CRON_SECRET`.
8. Promover a producción solo después de completar la matriz y respaldar la
   base de datos.
