# P0-06 — Matriz de ambientes y promoción

Fecha de auditoría: 2026-07-12

## Estado comprobado

| Capa                | Estado                                 | Evidencia                                                                                                              | Decisión de Gate A                                                    |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Local / CI          | Disponible                             | CI ejecuta tests, tipos, formato, build y contrato de ambiente                                                         | Usar solo proveedores `noop` y pagos deshabilitados                   |
| Vercel Preview      | Disponible                             | Proyecto `olffy-iqal`; previews de PR #3, #4 y #5 en estado `READY`                                                    | Es entorno de revisión, no staging transaccional                      |
| Staging Vercel      | No dedicado                            | No existe proyecto/dominio de staging separado; los despliegues de ramas tienen `target: null`                         | No promover ni ejecutar operaciones reales                            |
| Supabase Staging    | No disponible                          | Proyecto `olffy-production` solo presenta la rama default `main`; estado de migraciones observado: `MIGRATIONS_FAILED` | No usar producción como staging                                       |
| Producción Vercel   | Existe, no aprobada para nueva entrega | El historial contiene despliegues `target: production`, incluso desde la rama del PR paraguas                          | Congelar promociones hasta cerrar Gate A                              |
| Producción Supabase | Activa                                 | Proyecto `olffy-production`                                                                                            | Solo lectura operativa; no aplicar migraciones durante estabilización |

La aplicación de P0-06 queda **preparada pero no cerrada**: faltan un Supabase descartable/staging, credenciales segregadas y un smoke positivo de `/api/readiness` en ese entorno.

## Contrato por ambiente

| Categoría                | CI                      | Preview                                              | Staging                                     | Producción durante Gate A                                           |
| ------------------------ | ----------------------- | ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| URL pública              | `http://localhost:3000` | URL Vercel automática                                | HTTPS propio de staging                     | HTTPS canónico                                                      |
| Supabase                 | sin credenciales        | ausente o conjunto completo de staging               | obligatorio y separado de producción        | obligatorio de producción                                           |
| Shopify Storefront/Admin | no requerido            | solo credenciales de prueba si se valida integración | obligatorio, tienda de prueba               | obligatorio, tienda productiva                                      |
| Admin                    | no requerido            | credenciales efímeras si se prueba                   | contraseña + secreto de sesión únicos       | contraseña + secreto de sesión únicos                               |
| TUU online/POS           | `false`                 | `false`                                              | `false`                                     | `false` hasta Gate F                                                |
| DTE                      | `noop`                  | `noop`                                               | `noop` hasta Gate D                         | `noop` hasta Gate D                                                 |
| Marketing                | `noop`                  | `noop`                                               | `noop` hasta Gate E                         | `noop` hasta Gate E                                                 |
| Cron                     | sin ejecución           | no usar para pruebas destructivas                    | secreto propio; ejecución manual controlada | secreto propio; cron congelado si depende de migraciones pendientes |

Validación sin imprimir secretos:

```bash
npm run env:check -- staging
npm run env:check -- production
```

## Runbook para crear staging

1. Confirmar costo y crear una rama Supabase descartable desde el proyecto `olffy-production`; nunca reutilizar `main`.
2. Registrar el identificador de la rama y su fecha de expiración, sin copiar claves al repositorio.
3. Aplicar las migraciones versionadas en orden. No ejecutar `aplicar-migraciones-pendientes.sql` ni insertar manualmente historial de migraciones.
4. Reproducir `loyalty_lot_remaining()`; si aparece SQLSTATE `42804`, incorporar una sola vez la migración aislada `20260712120000_fix_lot_remaining_cast.sql` en el PR de base de datos.
5. Crear un proyecto Vercel de staging o asignar una rama fija con credenciales exclusivas de staging. No clonar secretos de producción sin rotarlos.
6. Ejecutar `npm run env:check -- staging` sobre las variables cargadas.
7. Desplegar el commit candidato, comprobar `/api/health` = 200 y `/api/readiness` = 200.
8. Ejecutar los smokes de admin, Shopify de prueba y RPC/RLS; guardar IDs de deployment y ejecución CI como evidencia.

## Backup y rollback antes de migrar

1. Capturar el SHA de aplicación y el deployment productivo vigente.
2. Generar un backup lógico de esquema y datos desde Supabase mediante el mecanismo oficial del proyecto; verificar que el artefacto existe y registrar checksum/fecha fuera del repositorio.
3. Probar restauración en un destino descartable antes de autorizar producción.
4. Aplicar migraciones por versión, sin bundles manuales y sin editar la tabla de historial.
5. Si falla una migración, detener la secuencia; no reintentar a ciegas. Restaurar el destino descartable o aplicar una migración forward de corrección revisada.
6. En Vercel, volver al deployment productivo registrado. Un rollback de aplicación no revierte la base de datos.

## Criterio de salida P0-06

- staging Supabase separado y descartable;
- staging Vercel con variables segregadas;
- replay limpio de migraciones y prueba de restauración;
- contrato `staging` aprobado;
- health/readiness 200;
- evidencia de smoke y rollback registrada;
- ningún proveedor de pago/DTE/marketing real habilitado prematuramente.
