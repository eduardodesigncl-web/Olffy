# Despliegue y QA de descuentos Shopify

Este runbook cubre el despliegue de los canjes de puntos conectados con
descuentos reales de Shopify. No reemplaza un respaldo de base de datos ni una
ventana de despliegue controlada.

## Estado verificado el 14 de junio de 2026

- `shopify.app.toml` declara `read_discounts` y `write_discounts`.
- `shopify app config validate --json` finaliza sin errores.
- La migracion `20260614123525_connect_reward_redemptions_to_shopify_discounts.sql`
  aun no esta aplicada en `olffy-production`.
- Produccion tiene 0 canjes y 0 transacciones con origen `reward_redemption`.
- Las 4 recompensas activas son descuentos con monto y vigencia validos.
- El entorno local no esta listo para una prueba real: el valor configurado
  como `SHOPIFY_ADMIN_API_ACCESS_TOKEN` comienza con `shpss_` y corresponde a
  un Client Secret, no a un Admin API access token.
- Vercel tiene dos proyectos conectados al mismo repositorio:
  - `olffy-iqal`: el despliegue del commit de la Tarea 6 esta `READY`.
  - `olffy`: el mismo commit falla porque el proyecto exige un Output Directory
    `public` después de ejecutar correctamente `next build`.
- Vercel CLI no tiene una sesion autenticada ni un proyecto enlazado en este
  workspace, por lo que las variables remotas deben verificarse en el Dashboard.

## Variables de entorno

Configurar como secretos de Vercel para `Production`:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_ADMIN_API_VERSION` (`2026-04`)
- Una sola estrategia de autenticacion Shopify:
  - `SHOPIFY_ADMIN_API_ACCESS_TOKEN`: access token Admin API real. No usar un
    Client Secret `shpss_`.
  - `SHOPIFY_ADMIN_API_CLIENT_ID` y `SHOPIFY_ADMIN_API_CLIENT_SECRET`: para una
    app de la misma organizacion instalada en una tienda propia. El backend
    obtiene el token mediante client credentials.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`: valor largo, aleatorio y distinto por entorno.
- `NEXT_PUBLIC_SITE_URL`: URL canonica de produccion usada por los callbacks de
  autenticacion.

Mantener tambien las variables Storefront ya usadas por el ecommerce. No
conectar despliegues Preview a Supabase y Shopify de produccion salvo que la
prueba este expresamente controlada.

## Checklist Supabase

- [ ] Confirmar que el proyecto destino sea `olffy-production`.
- [ ] Crear respaldo o verificar Point-in-Time Recovery antes de migrar.
- [ ] Confirmar que no existan canjes en estados incompatibles:

```sql
select status, count(*)
from public.reward_redemptions
group by status;
```

- [ ] Revisar las migraciones pendientes con `supabase migration list`.
- [ ] Aplicar la migracion con el pipeline de produccion o `supabase db push`.
- [ ] No ejecutar el archivo manualmente una segunda vez.
- [ ] Confirmar que la version `20260614123525` aparezca aplicada.
- [ ] Verificar las ocho columnas `shopify_discount_*`.
- [ ] Verificar los indices unicos de node ID y codigo.
- [ ] Verificar que los RPC nuevos solo tengan `EXECUTE` para `service_role`.
- [ ] Confirmar que `anon` y `authenticated` no ejecuten RPC administrativos.
- [ ] Verificar que la reversa generica rechace transacciones cuyo origen sea
      `reward_redemption`.
- [ ] Mantener disponible el log de migracion y no desplegar Vercel si falla.

La migracion no elimina datos existentes. Como agrega columnas, indices,
funciones y reemplaza una restriccion de estado, el rollback recomendado ante
un fallo posterior es detener aprobaciones y volver a la version anterior de la
aplicacion. No eliminar columnas mientras existan descuentos creados.

## Checklist Shopify

- [ ] Reemplazar `application_url = "https://example.com"` en
      `shopify.app.toml` por la URL real antes de publicar una version de la app.
- [ ] Confirmar que la app seleccionada sea la del `client_id` configurado.
- [ ] Confirmar `read_discounts` y `write_discounts` en `[access_scopes]`.
- [ ] Ejecutar `shopify app config validate --json`.
- [ ] Publicar los scopes con `shopify app deploy`.
- [ ] Abrir la app desde Shopify Admin y aprobar los nuevos permisos.
- [ ] Si la instalacion no solicita permisos, desinstalar y reinstalar la app
      desde su enlace de instalacion.
- [ ] Consultar `currentAppInstallation.accessScopes` y comprobar que ambos
      scopes de descuentos esten realmente concedidos.
- [ ] Confirmar que la tienda de `SHOPIFY_STORE_DOMAIN` coincide con la tienda
      donde esta instalada la app.
- [ ] Probar autenticacion Admin API sin registrar tokens en consola.

Cambiar el TOML no modifica una instalacion por si solo. Con Shopify managed
install, `shopify app deploy` publica la configuracion y el comercio debe
aprobar los scopes nuevos al abrir la app. La reinstalacion es la alternativa
cuando esa aprobacion no queda disponible o la instalacion usa otro flujo.

## Checklist Vercel

- [ ] Definir `olffy-iqal` como proyecto de despliegue o corregir `olffy`.
- [ ] En `olffy`, eliminar el Output Directory manual `public` y usar el preset
      Next.js antes de intentar otro despliegue.
- [ ] Evitar dos proyectos productivos conectados a la misma rama si no existe
      una razon operativa documentada.
- [ ] Enlazar y autenticar el proyecto correcto, o revisar las variables desde
      el Dashboard.
- [ ] Configurar todos los secretos en `Production`.
- [ ] Marcar tokens, Client Secret, Service Role y secretos admin como
      sensibles.
- [ ] No copiar variables productivas a Preview sin aislamiento de datos.
- [ ] Confirmar `NEXT_PUBLIC_SITE_URL` con HTTPS y el dominio final.
- [ ] Crear un Preview con variables de QA aisladas cuando exista ese entorno.
- [ ] Ejecutar `npm run build:check` con la misma configuracion del despliegue.
- [ ] Desplegar primero Supabase y scopes Shopify; desplegar Vercel al final.
- [ ] Revisar logs de Functions durante la primera aprobacion y cancelacion.
- [ ] Mantener temporalmente bloqueadas nuevas aprobaciones si Shopify o
      Supabase presentan errores de conciliacion.

## Reautorizacion Shopify

1. Verificar el `client_id` y la tienda objetivo.
2. Ejecutar `shopify app config validate --json`.
3. Ejecutar `shopify app deploy` y publicar la nueva version.
4. Abrir la app instalada desde Shopify Admin.
5. Aceptar `read_discounts` y `write_discounts`.
6. Consultar `currentAppInstallation.accessScopes`.
7. Si los scopes no aparecen, reinstalar la app y repetir la consulta.
8. Recién entonces habilitar aprobaciones de canjes en produccion.

## QA manual

Usar un cliente y una recompensa exclusivos para QA. Registrar IDs de cliente,
canje, transaccion, descuento Shopify y pedido.

### 1. Solicitar canje

1. Dar al cliente saldo suficiente.
2. Solicitar una recompensa desde `/cuenta`.
3. Confirmar estado `requested`.
4. Confirmar una sola transaccion negativa `reward_redemption`.
5. Confirmar que aun no existe codigo ni descuento en Shopify.

Resultado esperado: puntos reservados una vez y canje pendiente.

### 2. Aprobar y crear descuento

1. Aprobar desde el panel admin.
2. Confirmar estado `approved` y `shopify_discount_status = active`.
3. Confirmar node ID, codigo, fechas de creacion y vencimiento.
4. Buscar el codigo en Shopify Admin.
5. Confirmar monto, compra minima, `usageLimit = 1`,
   `appliesOncePerCustomer = true` y fecha de termino.

Resultado esperado: el canje solo queda aprobado después de crear y guardar el
descuento.

### 3. Ver codigo en cuenta

1. Iniciar sesion como el cliente dueño del canje.
2. Abrir `/cuenta/canjes`.
3. Confirmar que el codigo se muestra aprobado y vigente.
4. Iniciar sesion con otro cliente y confirmar que no puede verlo.

### 4. Usar codigo en checkout

1. Crear un carrito que cumpla la compra minima.
2. Aplicar el codigo y completar un pedido de prueba.
3. Intentar reutilizarlo y confirmar que Shopify lo rechaza.
4. En el admin de OLFFY, ejecutar `Verificar uso en Shopify`.
5. Confirmar estado `fulfilled`, uso mayor que cero y sin devolucion de puntos.

### 5. Cancelar un canje no usado

1. Crear y aprobar otro canje sin usarlo.
2. Cancelarlo desde el panel.
3. Confirmar que Shopify reporte cero usos antes de desactivarlo.
4. Confirmar descuento desactivado, estado `cancelled` y una sola devolucion.
5. Intentar usar el codigo y confirmar rechazo en checkout.
6. Confirmar que la reversa generica no se ofrece ni acepta para la transaccion
   original del canje.

### 6. Vencer un canje no usado

1. Usar una recompensa de vigencia corta en un entorno QA o ajustar la fecha
   solo en datos de prueba.
2. Tras el vencimiento, ejecutar `Procesar vencimiento`.
3. Confirmar cero usos, descuento no utilizable, estado `expired` y una sola
   devolucion de puntos.

### 7. Bloquear devolucion de un canje usado

1. Usar el codigo en un pedido real de prueba.
2. Intentar cancelar el canje.
3. Confirmar que el sistema detecta uso, marca `fulfilled` y no devuelve puntos.
4. Intentar la reversa generica de la transaccion original.
5. Confirmar que el RPC la rechaza.

### 8. Fallos controlados

- Quitar temporalmente `write_discounts` en un entorno aislado: la aprobacion
  debe volver a `requested` con error controlado y sin descuento activo.
- Usar credenciales invalidas en QA: no debe quedar un canje aprobado.
- Simular fallo de Supabase después de crear el descuento: el descuento debe
  desactivarse o el canje quedar en `reconciliation_required`.
- Lanzar dos solicitudes simultaneas con saldo para una sola: solo una debe
  reservar puntos.

## Operacion y riesgos restantes

- El vencimiento y la verificacion de uso son procesos manuales; requieren una
  rutina diaria hasta implementar automatizacion.
- Shopify puede reflejar el contador de uso con retraso. No cancelar
  inmediatamente después de un checkout; verificar tambien el pedido antes de
  devolver puntos.
- Sin un Shopify Customer GID confiable, el descuento queda protegido por codigo
  unico, limite de un uso y expiracion, pero puede ser compartido.
- Un fallo entre Shopify y Supabase puede producir
  `reconciliation_required`; este estado exige revision manual antes de tocar
  puntos o descuentos.
- `application_url` sigue siendo un placeholder hasta configurar el dominio de
  produccion.
