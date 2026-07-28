# Reconciliación del historial Supabase

## Resultado

El directorio `supabase/migrations` usa los mismos 20 timestamps registrados en
`supabase_migrations.schema_migrations` del proyecto `bocbbpuxnnxxocamerpl`.
Este cambio reconcilia archivos e historial; no ejecuta DDL ni modifica datos de
producción.

## Hallazgos

- `20260620120000_add_production_transaction_pipeline.sql` estaba registrado en
  producción como `20260628230328`.
- `20260709120000_add_digital_sales_admin.sql` estaba registrado en producción
  como `20260709155049`.
- Las versiones iniciales de `expand_loyalty_mvp` y
  `add_physical_sales_pos_shopify` habían cambiado en Git después de ser
  aplicadas. Se restauró el SQL exacto conservado por Supabase.
- Las cinco versiones `20260710130000` a `20260712120000` estaban marcadas como
  aplicadas sin statements almacenados. Sus archivos de replay provienen del
  historial funcional verificado; `20260712120000` contiene la corrección del
  cast `numeric` a `bigint`.
- Las primeras tres migraciones de soporte tenían timestamps o contenidos
  diferentes. Se restauraron desde los statements almacenados por Supabase.

## Protección contra nueva divergencia

`npm run migrations:verify` comprueba:

- el conjunto exacto de timestamps y nombres;
- que no existan migraciones faltantes o inesperadas;
- el checksum canónico de cada archivo, normalizando solamente finales de línea.

El workflow `quality` ejecuta esta validación antes de las pruebas unitarias.
Una migración ya registrada no debe editarse: todo cambio futuro debe agregarse
como una migración nueva.

## Validación pendiente antes de promover cambios de esquema

1. Ejecutar un replay completo en una base desechable.
2. Comparar esquema, funciones, grants y políticas RLS con producción.
3. Ejecutar advisors de seguridad y rendimiento.
4. Probar las RPC de POS, puntos, canjes y soporte.
5. Aplicar nuevas migraciones únicamente después de aprobar el replay.

La rama principal de Supabase no se debe reparar manualmente mientras el
repositorio no haya incorporado este historial.

## Advisors observados

La revisión de producción no detectó errores críticos. Quedan como seguimiento:

- activar la protección contra contraseñas filtradas en Supabase Auth;
- documentar que las tablas internas con RLS y sin políticas se consumen
  exclusivamente mediante `service_role`;
- agregar índices para claves foráneas únicamente después de validar sus patrones
  reales de consulta;
- no eliminar índices marcados como no usados sin un período representativo de
  métricas.

Referencias:

- [RLS habilitado sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Claves foráneas sin índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- [Protección de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
