# Contratos frontend/backend de OLFFY

Este documento define los datos, acciones y estados que cada pantalla debe
contemplar. Su objetivo es permitir que diseño y frontend evolucionen sin
asumir campos que el backend no entrega ni ocultar estados operativos
importantes.

## Convenciones generales

- Shopify Storefront es la fuente pública de catálogo, variantes, precio,
  disponibilidad, carrito y checkout.
- Shopify Admin es la fuente administrativa de productos, colecciones,
  inventario y órdenes creadas por el POS.
- Supabase mantiene cuentas cliente, puntos, transacciones, recompensas, canjes
  y ventas físicas.
- Las rutas `/admin/*` requieren sesión admin firmada.
- Las rutas privadas `/cuenta/*` requieren sesión Supabase y una cuenta OLFFY
  vinculada.
- Los GID de Shopify son opacos. Figma no debe asumir que son números ni
  mostrarlos al usuario salvo en vistas de soporte.
- Los montos se almacenan y presentan en CLP. El frontend debe recibir también
  `currencyCode` cuando el dato viene de Shopify.
- Todo listado debe diseñarse con estados `loading`, `empty`, `error` y
  contenido parcialmente disponible.
- Los datos demo actuales son una ayuda visual temporal. No constituyen un
  contrato de catálogo ni deben presentarse como confirmación de inventario.

## 1. Home

- **Objetivo:** presentar la marca, destacar productos y llevar al usuario a
  tienda, novedades y categorías.
- **Ruta:** `/`.
- **Tipo de usuario:** público.
- **Fuente de datos:** Shopify Storefront para productos; contenido editorial
  local/CMS para hero, historia, categorías y newsletter.
- **Datos necesarios:** hero, CTA, productos destacados, productos favoritos,
  `id`, `handle`, nombre, imagen, precio, moneda, categoría, etiqueta y
  disponibilidad.
- **Acciones disponibles:** abrir tienda, novedades, categoría, producto y
  newsletter.
- **Estados loading:** skeleton de hero y grillas; reservar proporción de
  imágenes para evitar saltos.
- **Estados empty:** ocultar una sección de productos vacía y mantener CTA a
  tienda; no mostrar carruseles vacíos.
- **Estados error:** mensaje no intrusivo para catálogo y contenido editorial
  estático disponible.
- **Validaciones:** enlaces con `handle` válido; imagen con `alt`; no mostrar
  precio ni stock inventado como dato real.
- **Permisos:** ninguno.
- **Riesgos técnicos:** hoy puede aparecer catálogo demo si Shopify falla;
  destacados se derivan por posición y etiqueta.
- **Notas para diseño/Figma:** diseñar módulos independientes y reordenables;
  contemplar 0, 1, 2 y 4 productos.

## 2. Tienda

- **Objetivo:** explorar el catálogo completo y entrar a una ficha.
- **Ruta:** `/tienda`.
- **Tipo de usuario:** público.
- **Fuente de datos:** Shopify Storefront.
- **Datos necesarios:** total de resultados, productos, imágenes, precios,
  moneda, disponibilidad, etiquetas, categorías, filtros y orden vigente.
- **Acciones disponibles:** filtrar, ordenar, paginar/cargar más y abrir
  producto.
- **Estados loading:** skeleton de controles y grilla; conservar filtros
  seleccionados.
- **Estados empty:** mensaje según catálogo vacío o filtros sin coincidencias,
  con acción para limpiar filtros.
- **Estados error:** error recuperable con reintento; no reemplazar
  silenciosamente por inventario ficticio en producción.
- **Validaciones:** parámetros de filtro permitidos, orden conocido y página
  positiva.
- **Permisos:** ninguno.
- **Riesgos técnicos:** filtros y paginación visibles actualmente son
  principalmente presentacionales; el contrato final debe ser cursor-based.
- **Notas para diseño/Figma:** separar barra de resultados, filtros móviles,
  grilla y paginación; contemplar productos agotados.

## 3. Producto

- **Objetivo:** explicar un producto real, permitir seleccionar variante y
  añadirla al carrito.
- **Ruta:** `/producto/[handle]`.
- **Tipo de usuario:** público.
- **Fuente de datos:** Shopify Storefront.
- **Datos necesarios:** `handle`, título, descripción real, galería, opciones,
  variantes, precio, moneda, disponibilidad, cantidad conocida, SKU opcional,
  categoría y productos relacionados.
- **Acciones disponibles:** seleccionar opciones, cambiar cantidad, agregar al
  carrito, abrir carrito y navegar a relacionados.
- **Estados loading:** skeleton de galería, título, precio, selector y CTA.
- **Estados empty:** `404` si no existe; relacionados pueden omitirse.
- **Estados error:** diferenciar producto inexistente de fallo temporal de
  Shopify.
- **Validaciones:** variante seleccionada, cantidad mayor a cero y no superior
  al stock conocido; botón deshabilitado sin variante vendible.
- **Permisos:** ninguno.
- **Riesgos técnicos:** la pantalla OLFFY actual simplifica la variante
  principal y mantiene fallback visual; Product JSON-LD solo se emite con datos
  Shopify reales.
- **Notas para diseño/Figma:** contemplar una o muchas imágenes, producto sin
  descripción, agotado, precio variable y opciones largas.

## 4. Carrito

- **Objetivo:** revisar líneas, cantidades y total antes de ir al checkout de
  Shopify.
- **Ruta:** `/carrito` para la vista OLFFY; existe además el carrito Storefront
  usado por componentes compartidos.
- **Tipo de usuario:** público; puede usar cookie de carrito.
- **Fuente de datos:** contrato objetivo Shopify Cart.
- **Datos necesarios:** `cartId`, líneas, `lineId`, variante, producto, imagen,
  opciones, cantidad, precio unitario, subtotal, total, impuestos disponibles,
  descuentos, warnings y `checkoutUrl`.
- **Acciones disponibles:** aumentar, disminuir, eliminar, aplicar descuento y
  continuar al checkout.
- **Estados loading:** actualización por línea, total recalculando y checkout
  iniciando.
- **Estados empty:** carrito vacío con CTA a tienda.
- **Estados error:** error por línea, stock cambiado, variante no disponible,
  carrito vencido y checkout no disponible.
- **Validaciones:** cantidad entera positiva, máximo de stock cuando se conoce,
  `checkoutUrl` existente y código de descuento normalizado.
- **Permisos:** ninguno.
- **Riesgos técnicos:** la ruta visual actual usa productos de demostración;
  las mutaciones compartidas reducen errores Shopify a mensajes genéricos y no
  exponen `userErrors`/warnings.
- **Notas para diseño/Figma:** diferenciar error global y error de una línea;
  diseñar totales provisionales y cambios de precio.

## 5. Search

- **Objetivo:** encontrar productos por texto y ordenar resultados.
- **Ruta:** `/search?q=[texto]&sort=[orden]`.
- **Tipo de usuario:** público.
- **Fuente de datos:** Shopify Storefront `getProducts`.
- **Datos necesarios:** consulta, orden, cantidad de resultados y productos con
  imagen, título, precio, moneda, disponibilidad y URL canónica.
- **Acciones disponibles:** buscar, cambiar orden, limpiar consulta y abrir
  producto.
- **Estados loading:** skeleton de resumen y grilla.
- **Estados empty:** consulta vacía o sin coincidencias con mensajes distintos.
- **Estados error:** fallo de búsqueda con reintento y consulta preservada.
- **Validaciones:** consulta limitada y saneada; `sort` debe pertenecer al
  catálogo de órdenes soportadas.
- **Permisos:** ninguno.
- **Riesgos técnicos:** mensajes actuales mezclan inglés y español; la ruta es
  `noindex` por contenido delgado.
- **Notas para diseño/Figma:** no tratar “sin consulta” como error; mostrar el
  término buscado y filtros activos.

## 6. Admin productos

- **Objetivo:** listar, crear y editar el catálogo administrado en Shopify.
- **Ruta:** `/admin/productos`, `/admin/productos/nuevo` y
  `/admin/productos/[gid]`.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Shopify Admin GraphQL.
- **Datos necesarios:** GID, título, handle, estado, imágenes, variantes,
  precio, inventario, tags y errores de usuario Shopify.
- **Acciones disponibles:** crear, editar, archivar/eliminar según soporte y
  volver al listado.
- **Estados loading:** tabla skeleton y formulario bloqueado durante guardado.
- **Estados empty:** catálogo sin productos con CTA de creación.
- **Estados error:** conexión/token/scopes, producto no encontrado y errores de
  campo devueltos por Shopify.
- **Validaciones:** título requerido, precio CLP no negativo, inventario entero,
  estado permitido, tags normalizados e ID como GID válido.
- **Permisos:** sesión admin; API `/api/admin/products*` también protegida.
- **Riesgos técnicos:** listado limitado a 50; detalle consulta hasta 10
  variantes; creación con inventario puede requerir `locationId`; precio de
  edición se deriva a Shopify Admin.
- **Notas para diseño/Figma:** permitir errores por campo, estado de conexión y
  producto con múltiples variantes aunque el MVP edite solo la principal.

## 7. Admin colecciones

- **Objetivo:** listar, crear y editar colecciones Shopify.
- **Ruta:** `/admin/colecciones`, `/admin/colecciones/nuevo` y
  `/admin/colecciones/[gid]`.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Shopify Admin GraphQL.
- **Datos necesarios:** GID, título, handle, cantidad de productos y errores de
  usuario.
- **Acciones disponibles:** crear, editar y eliminar cuando corresponda.
- **Estados loading:** tabla skeleton y guardado bloqueado.
- **Estados empty:** sin colecciones con CTA de creación.
- **Estados error:** token/scopes, colección inexistente, handle/título
  rechazado y error de red.
- **Validaciones:** título requerido, GID normalizado y respuesta `userErrors`
  asociada al campo.
- **Permisos:** sesión admin y API administrativa protegida.
- **Riesgos técnicos:** listado limitado a 50; el formulario actual solo edita
  título y no reglas, SEO ni asignación de productos.
- **Notas para diseño/Figma:** no diseñar todavía un constructor de reglas como
  si estuviera soportado; separar colección manual/automática como estado
  futuro.

## 8. Admin POS TUU

- **Objetivo:** registrar una venta física pagada en TUU, crear la orden pagada
  en Shopify y registrar puntos/auditoría.
- **Ruta:** `/admin/puntos/ventas`.
- **Tipo de usuario:** operador admin.
- **Fuente de datos:** Shopify Admin para variantes, precios, stock y orden;
  Supabase para clientes, reglas, venta y puntos.
- **Datos necesarios:** resultados por variante, SKU, stock, carrito,
  cliente/saldo, regla activa, beneficio, referencia TUU, comprobante,
  responsable, notas, total, puntos usados/ganados e historial reciente.
- **Acciones disponibles:** buscar producto, agregar/quitar, cambiar cantidad,
  seleccionar cliente y beneficio, confirmar pago y crear orden.
- **Estados loading:** búsqueda, confirmación transaccional y recarga del
  historial.
- **Estados empty:** búsqueda inicial, sin resultados, carrito vacío, sin
  clientes y sin ventas.
- **Estados error:** stock/precio cambió, orden Shopify falló, registro Supabase
  falló, referencia duplicada o conciliación requerida.
- **Validaciones:** carrito no vacío, stock suficiente, total positivo,
  beneficio único, puntos dentro del máximo, referencia TUU y responsable
  obligatorios, pago confirmado.
- **Permisos:** sesión admin y acceso a Shopify Orders/Products más service role
  de Supabase.
- **Riesgos técnicos:** operación distribuida Shopify/Supabase; requiere
  idempotencia y recuperación ante éxito parcial.
- **Notas para diseño/Figma:** mantener resumen fijo y confirmación explícita;
  mostrar claramente “venta recuperada”, “completada” y “requiere soporte”.

## 9. Admin puntos

- **Objetivo:** resumir el programa y ofrecer accesos operativos.
- **Ruta:** `/admin/puntos`.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Supabase; Shopify/TUU aparecen como contexto.
- **Datos necesarios:** clientes totales/activos, puntos vigentes/históricos,
  ventas físicas, monto, puntos canjeados, recompensas activas y canjes.
- **Acciones disponibles:** abrir clientes, POS y recompensas.
- **Estados loading:** skeleton de métricas y accesos.
- **Estados empty:** métricas en cero, no ausencia de layout.
- **Estados error:** configuración privada faltante o migración no aplicada.
- **Validaciones:** métricas no negativas y montos CLP.
- **Permisos:** sesión admin.
- **Riesgos técnicos:** agregaciones dependen del esquema/migraciones vigentes;
  no presentar cero cuando en realidad falló la carga.
- **Notas para diseño/Figma:** el error debe reemplazar métricas inciertas, no
  parecer un estado vacío.

## 10. Admin clientes

- **Objetivo:** buscar, crear y operar la cuenta de fidelización de un cliente.
- **Ruta:** `/admin/puntos/clientes` y `/admin/puntos/clientes/[id]`.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Supabase; Shopify Customer GID es una referencia opcional.
- **Datos necesarios:** ID interno, nombre, email, teléfono, estado, saldo,
  acumulados, Shopify Customer GID, transacciones, recompensas y canjes.
- **Acciones disponibles:** buscar, crear, abrir detalle, ajustar/revertir
  puntos, canjear y gestionar estados de canje.
- **Estados loading:** búsqueda, detalle y cada mutación con bloqueo
  independiente.
- **Estados empty:** sin coincidencias, cliente sin historial y sin canjes.
- **Estados error:** duplicado, datos inválidos, saldo insuficiente, operación
  ya revertida o dependencia externa no disponible.
- **Validaciones:** email requerido y normalizado, teléfono opcional, puntos
  enteros, motivo/responsable requeridos e IDs positivos.
- **Permisos:** sesión admin; acciones críticas solo en servidor.
- **Riesgos técnicos:** búsqueda limitada; GID puede faltar; ajustes manuales
  requieren trazabilidad y prevención de doble envío.
- **Notas para diseño/Figma:** separar identidad, saldo, historial y acciones
  peligrosas; pedir confirmación para reversas/cancelaciones.

## 11. Admin recompensas

- **Objetivo:** consultar y crear beneficios canjeables.
- **Ruta:** `/admin/puntos/recompensas`.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Supabase; Shopify solo interviene al aprobar un canje.
- **Datos necesarios:** ID, nombre, descripción, tipo, costo en puntos,
  descuento CLP, compra mínima, vigencia y estado activo.
- **Acciones disponibles:** crear; edición/activación debe considerarse contrato
  futuro si se incorpora a la UI.
- **Estados loading:** tarjetas y formulario en envío.
- **Estados empty:** sin recompensas con formulario visible.
- **Estados error:** valores inválidos, duplicidad lógica o fallo de Supabase.
- **Validaciones:** nombre, puntos y descuento mayores a cero; compra mínima no
  negativa; vigencia mayor a cero.
- **Permisos:** sesión admin.
- **Riesgos técnicos:** cambiar una recompensa no debe alterar canjes históricos;
  la creación no verifica por sí sola los scopes reales de descuentos.
- **Notas para diseño/Figma:** distinguir activa/inactiva y datos históricos;
  no prometer preview de código antes de aprobar un canje.

## 12. Admin canjes

- **Objetivo:** revisar solicitudes, aprobar/crear descuento, marcar uso,
  cancelar o conciliar.
- **Ruta:** actualmente sección de `/admin/puntos/clientes/[id]`; resumen en
  `/admin/cuenta`. No existe listado global dedicado.
- **Tipo de usuario:** administrador.
- **Fuente de datos:** Supabase y Shopify Admin Discounts.
- **Datos necesarios:** ID, cliente, recompensa, puntos, estado, fechas, código,
  node ID Shopify, uso, expiración, motivo de cancelación y estado de
  conciliación.
- **Acciones disponibles:** aprobar, sincronizar uso, marcar entregado,
  cancelar, expirar y devolver puntos cuando corresponda.
- **Estados loading:** bloqueo por canje, no por página completa.
- **Estados empty:** cliente sin canjes; futuro listado global sin resultados.
- **Estados error:** creación/desactivación Shopify fallida, estado obsoleto,
  descuento usado, conciliación requerida o acceso externo ausente.
- **Validaciones:** transición de estado permitida, idempotencia, responsable,
  uso real antes de devolver puntos y código único.
- **Permisos:** sesión admin; secretos Shopify y service role solo en servidor.
- **Riesgos técnicos:** consistencia eventual, sin cron de vencimiento y
  ausencia de vista global de excepciones.
- **Notas para diseño/Figma:** diseñar una máquina de estados legible; resaltar
  `reconciliation_required` como trabajo operativo, no error genérico.

## 13. Cliente cuenta

- **Objetivo:** mostrar saldo, progreso, movimientos recientes y perfil.
- **Ruta:** `/cuenta`.
- **Tipo de usuario:** cliente autenticado y vinculado.
- **Fuente de datos:** Supabase.
- **Datos necesarios:** nombre, email, teléfono, estado, saldo, acumulados,
  próxima recompensa, regla activa, canjes pendientes y transacciones recientes.
- **Acciones disponibles:** abrir recompensas, historial, canjes y cerrar sesión
  desde el shell.
- **Estados loading:** skeleton del resumen completo.
- **Estados empty:** cuenta válida sin movimientos ni próxima recompensa.
- **Estados error:** sesión vencida, cuenta no vinculada o datos no disponibles.
- **Validaciones:** saldo coherente con ledger; estado solo `active`/`blocked`.
- **Permisos:** solo el usuario dueño de la cuenta.
- **Riesgos técnicos:** la identidad Auth y la fila de fidelización deben seguir
  vinculadas; una cuenta bloqueada conserva lectura pero no canje.
- **Notas para diseño/Figma:** hacer visible el estado bloqueado sin ocultar
  historial; no usar progreso negativo.

## 14. Cliente historial

- **Objetivo:** explicar todos los movimientos que forman el saldo.
- **Ruta:** `/cuenta/historial`.
- **Tipo de usuario:** cliente autenticado.
- **Fuente de datos:** Supabase.
- **Datos necesarios:** ID, fecha, puntos con signo, tipo, fuente, descripción,
  referencia y estado/reversa cuando aplique.
- **Acciones disponibles:** lectura; filtros/paginación son evolución futura.
- **Estados loading:** skeleton de lista.
- **Estados empty:** cuenta sin movimientos con explicación.
- **Estados error:** no se puede cargar el ledger; no mostrar saldo calculado
  localmente.
- **Validaciones:** orden cronológico, fechas válidas y puntos enteros.
- **Permisos:** solo transacciones del cliente autenticado.
- **Riesgos técnicos:** crecimiento del historial requerirá paginación; nombres
  técnicos deben mapearse a lenguaje cliente.
- **Notas para diseño/Figma:** diferenciar ganados, usados, ajustes,
  vencimientos y reversas por texto además de color.

## 15. Cliente recompensas

- **Objetivo:** mostrar beneficios activos y permitir solicitar uno.
- **Ruta:** `/cuenta/recompensas`.
- **Tipo de usuario:** cliente autenticado.
- **Fuente de datos:** Supabase.
- **Datos necesarios:** saldo/estado del cliente y recompensa con nombre,
  descripción, puntos, descuento, compra mínima y vigencia.
- **Acciones disponibles:** solicitar canje con `rewardId` y `requestId`
  idempotente.
- **Estados loading:** tarjetas y botón de la recompensa enviada.
- **Estados empty:** no hay recompensas activas.
- **Estados error:** saldo insuficiente, cuenta bloqueada, solicitud duplicada o
  backend no disponible.
- **Validaciones:** recompensa activa, cliente activo, saldo suficiente e ID
  válido.
- **Permisos:** cliente dueño de la cuenta.
- **Riesgos técnicos:** solicitar no equivale a tener código; aprobación y
  creación Shopify ocurren después.
- **Notas para diseño/Figma:** distinguir “disponible”, “faltan puntos” y
  “canjes pausados”; confirmar antes de gastar puntos.

## 16. Cliente canjes

- **Objetivo:** seguir el estado y obtener el código cuando esté aprobado.
- **Ruta:** `/cuenta/canjes`.
- **Tipo de usuario:** cliente autenticado.
- **Fuente de datos:** Supabase, sincronizado operativamente con Shopify.
- **Datos necesarios:** recompensa, puntos, fecha, estado, código, expiración y
  motivo de cancelación.
- **Acciones disponibles:** lectura y copia del código; soporte como acción
  futura.
- **Estados loading:** skeleton de tarjetas.
- **Estados empty:** nunca ha solicitado canjes, con CTA a recompensas.
- **Estados error:** no se puede cargar o estado en conciliación.
- **Validaciones:** mostrar código solo si está aprobado y no vencido; no
  exponer identificadores internos.
- **Permisos:** solo canjes del cliente autenticado.
- **Riesgos técnicos:** la fecha puede vencer antes de que un job cambie el
  estado; la UI ya debe representar `expired_pending` y conciliación.
- **Notas para diseño/Figma:** estados solicitando, creando, aprobado, usado,
  cancelando, cancelado, vencido y revisión deben ser distinguibles sin
  depender únicamente del color.

## 17. Login cliente

- **Objetivo:** iniciar sesión o crear/verificar una cuenta cliente.
- **Ruta:** `/cuenta/login?mode=login|register`.
- **Tipo de usuario:** público/no autenticado.
- **Fuente de datos:** Supabase Auth y tabla de cuentas OLFFY.
- **Datos necesarios:** modo, disponibilidad de configuración, mensajes de URL
  y estado de sesión existente.
- **Acciones disponibles:** login, registro, cambiar modo y abrir contacto.
- **Estados loading:** envío del formulario, validación de sesión y espera de
  redirección.
- **Estados empty:** no aplica; formulario siempre presente si hay configuración.
- **Estados error:** credenciales, email no inscrito, email ya usado,
  confirmación pendiente, rate limit de proveedor o configuración ausente.
- **Validaciones:** email válido, contraseña mínima 8, confirmación idéntica,
  nombre y teléfono requeridos al registrar.
- **Permisos:** usuarios autenticados listos se redirigen a `/cuenta`.
- **Riesgos técnicos:** depende de correo de verificación y configuración
  pública Supabase; mensajes deben evitar enumerar cuentas sensibles.
- **Notas para diseño/Figma:** mantener login y registro claramente separados;
  diseñar confirmación enviada, sesión cerrada y entorno no configurado.

## 18. Login admin

- **Objetivo:** crear una sesión admin firmada para el panel.
- **Ruta:** `/admin/login`.
- **Tipo de usuario:** administrador no autenticado.
- **Fuente de datos:** `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` y
  `/api/admin/auth`.
- **Datos necesarios:** contraseña y respuesta de autenticación.
- **Acciones disponibles:** iniciar sesión.
- **Estados loading:** botón “Verificando” y formulario bloqueado.
- **Estados empty:** no aplica.
- **Estados error:** contraseña incorrecta, configuración faltante, red o error
  interno.
- **Validaciones:** contraseña requerida; comparación y cookie solo en servidor.
- **Permisos:** una sesión válida redirige/habilita `/admin/*`.
- **Riesgos técnicos:** contraseña compartida y ausencia de rate limiting,
  identidad individual, roles y auditoría por usuario.
- **Notas para diseño/Figma:** no agregar recuperación de contraseña ni roles
  hasta que exista backend; incluir estado temporal de demasiados intentos como
  contrato futuro.

## Contratos transversales para componentes

### Producto resumido

```ts
type ProductSummary = {
  id: string;
  handle: string;
  title: string;
  image?: { url: string; altText?: string };
  price?: { amount: string; currencyCode: string };
  availableForSale: boolean;
  category?: string;
  badge?: string;
};
```

### Estado de carga remota

```ts
type RemoteState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty"; reason?: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      retryable: boolean;
    };
```

### Regla de diseño

Figma debe entregar al menos una variante de componente para `loading`,
`empty`, `error`, `disabled` y `success` cuando la pantalla tenga acciones. Un
happy path sin esos estados no se considera contrato completo.
