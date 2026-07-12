# P0-05 — Contención de acciones mock

Fecha de verificación: 2026-07-12

## Alcance cerrado

- Recompensas: editar, pausar/activar, ver canjes, aprobar, rechazar y abrir cliente permanecen visibles pero deshabilitadas; no muestran confirmaciones ficticias.
- Equipo: se retiró la lista semilla, la captura de RUT y la persistencia en `localStorage`. La sección declara que requiere cuentas, roles y auditoría server-side.
- Productos: se retiraron la marca local de “destacado”, sus métricas/filtros y el estado de sincronización simulado. La acción disponible solo recarga la vista y declara que no modifica Shopify.
- Se conservaron las operaciones reales existentes: creación de recompensas en Supabase, navegación al administrador de Shopify y mutaciones reales de colecciones.

## Evidencia

- Prueba de regresión: `src/admin-panel/components/admin/mock-actions-containment.test.ts`.
- Suite Vitest: 8 archivos, 8 pruebas aprobadas.
- TypeScript: aprobado.
- Build de producción: aprobado.
- Verificación manual en navegador local: Recompensas, Ajustes > Equipo y Productos renderizan el estado no disponible sin acciones ficticias.

## Pendiente fuera de este cambio

Las acciones deshabilitadas solo deben habilitarse cuando exista persistencia server-side, autorización por rol y auditoría. Los datos demostrativos de solo lectura que aún existan se tratan en el inventario de mocks y no se convierten en mutaciones locales.
