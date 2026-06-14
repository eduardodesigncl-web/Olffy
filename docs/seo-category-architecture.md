# Arquitectura SEO/GEO de categorías públicas de OLFFY

Documento estratégico para una etapa posterior de contenido e implementación.
No autoriza crear rutas, colecciones, redirects ni contenido final en este
bloque.

## Principios

- Cada ruta indexable debe resolver una intención principal distinta.
- Una categoría comercial necesita inventario real y estable antes de
  indexarse.
- Las páginas GEO deben aportar información local verificable, no repetir una
  categoría cambiando solo la ciudad.
- Las URLs propuestas deben usar canonical propia únicamente cuando su
  contenido y propósito sean únicos.
- El contenido debe responder preguntas concretas, describir materiales/usos y
  enlazar productos o categorías relevantes.
- No se deben inventar dirección, horarios, teléfono, reseñas, autores, stock,
  precios ni atributos de producto.
- Shopify puede aportar productos y colecciones, pero el contenido editorial y
  los metadatos necesitan una capa controlada por OLFFY.

## Decisiones de arquitectura

1. `/libretas` será la categoría comercial prioritaria para la intención amplia
   “libretas”.
2. `/cuadernos-y-libretas` no debe competir con `/libretas`. Inicialmente se
   recomienda redirect/canonical hacia `/libretas`; solo podría ser indexable
   si se convierte en un hub claramente más amplio con subcategorías reales.
3. `/sobre-olffy` es la URL objetivo de marca. La ruta actual
   `/nuestra-historia` necesitará una decisión de migración y redirect 301 antes
   de publicar ambas.
4. `/search/[collection]` no debe ser la URL SEO final de categorías
   estratégicas. Puede seguir como navegación técnica, pero las landings
   públicas necesitan rutas legibles y canónicas.
5. Las categorías que dependan de Shopify solo deben indexarse cuando la
   colección exista, entregue productos y pueda mantenerse.

## Arquitectura por ruta

### `/`

- **Intención de búsqueda:** marca, descubrimiento de papelería creativa y
  navegación hacia categorías.
- **Keyword principal:** OLFFY.
- **Keywords secundarias:** papelería chilena, papelería creativa, papelería
  Viña del Mar, regalos de papelería.
- **Tipo de página:** home de marca y hub comercial.
- **Indexable:** sí.
- **Depende de colección Shopify:** parcialmente; destacados sí, estructura de
  marca no.
- **Contenido mínimo recomendado:** propuesta de valor, categorías principales,
  productos destacados reales, origen de marca, prueba local verificable y
  accesos a ayuda.
- **Schema recomendado:** `Organization`, `WebSite` y `BreadcrumbList` solo
  cuando aplique; no usar `LocalBusiness` sin datos locales completos.
- **Enlaces internos recomendados:** tienda, libretas, stickers, planners,
  regalos, journaling, sobre OLFFY, FAQ y contacto.
- **Riesgo de canibalización:** medio con `/tienda` si la home se optimiza como
  catálogo genérico.
- **Prioridad:** alta.

### `/tienda`

- **Intención de búsqueda:** explorar todo el catálogo OLFFY.
- **Keyword principal:** tienda de papelería.
- **Keywords secundarias:** papelería online Chile, tienda de papelería
  creativa, productos OLFFY.
- **Tipo de página:** catálogo general.
- **Indexable:** sí.
- **Depende de colección Shopify:** sí, catálogo completo.
- **Contenido mínimo recomendado:** H1, introducción breve, filtros funcionales,
  productos reales, acceso a categorías y texto inferior que no replique la
  home.
- **Schema recomendado:** `CollectionPage`, `ItemList` con productos reales y
  `BreadcrumbList`.
- **Enlaces internos recomendados:** todas las categorías comerciales y fichas
  de producto.
- **Riesgo de canibalización:** medio con home y categorías si intenta atacar
  keywords específicas.
- **Prioridad:** alta.

### `/libretas`

- **Intención de búsqueda:** comprar o comparar libretas creativas.
- **Keyword principal:** libretas.
- **Keywords secundarias:** libretas bonitas, libretas ilustradas, libretas
  chilenas, libretas para escribir, libretas de regalo.
- **Tipo de página:** categoría comercial principal.
- **Indexable:** sí, cuando exista inventario real suficiente.
- **Depende de colección Shopify:** sí, colección canónica `libretas`.
- **Contenido mínimo recomendado:** introducción útil, grilla, usos, formatos y
  materiales reales, criterios de elección, preguntas breves y enlaces a
  journaling/regalos.
- **Schema recomendado:** `CollectionPage`, `ItemList`, `BreadcrumbList`;
  `FAQPage` solo con preguntas visibles y respuestas verificadas.
- **Enlaces internos recomendados:** producto, journaling, regalos, planners,
  FAQ y tienda.
- **Riesgo de canibalización:** alto con `/cuadernos-y-libretas`; resolver antes
  de indexar.
- **Prioridad:** alta.

### `/stickers`

- **Intención de búsqueda:** comprar stickers decorativos o para papelería.
- **Keyword principal:** stickers.
- **Keywords secundarias:** stickers bonitos, stickers para journaling,
  stickers chilenos, stickers para agenda.
- **Tipo de página:** categoría comercial.
- **Indexable:** sí, con colección e inventario reales.
- **Depende de colección Shopify:** sí.
- **Contenido mínimo recomendado:** estilos disponibles, usos reales,
  materiales/acabados confirmados, grilla y selección por ocasión o técnica.
- **Schema recomendado:** `CollectionPage`, `ItemList` y `BreadcrumbList`.
- **Enlaces internos recomendados:** journaling, planners, regalos, libretas y
  productos relacionados.
- **Riesgo de canibalización:** medio con journaling si ambas páginas usan el
  mismo texto y surtido.
- **Prioridad:** alta.

### `/planners-y-agendas`

- **Intención de búsqueda:** organizarse y comprar planner o agenda.
- **Keyword principal:** planners y agendas.
- **Keywords secundarias:** agenda creativa, planner semanal, agenda chilena,
  planner para organizarse.
- **Tipo de página:** categoría comercial comparativa.
- **Indexable:** sí, con surtido estable.
- **Depende de colección Shopify:** sí.
- **Contenido mínimo recomendado:** diferencia entre planner y agenda, formatos,
  temporalidad, usos, grilla y guía de elección sin inventar características.
- **Schema recomendado:** `CollectionPage`, `ItemList`, `BreadcrumbList`.
- **Enlaces internos recomendados:** libretas, stickers, journaling, regalos y
  FAQ.
- **Riesgo de canibalización:** bajo si el foco se mantiene en planificación.
- **Prioridad:** alta.

### `/regalos-de-papeleria`

- **Intención de búsqueda:** encontrar un regalo creativo de papelería.
- **Keyword principal:** regalos de papelería.
- **Keywords secundarias:** regalos para amantes de la papelería, regalos
  creativos Chile, kits de papelería, regalos para journaling.
- **Tipo de página:** categoría/landing por ocasión.
- **Indexable:** sí.
- **Depende de colección Shopify:** sí, idealmente colección curada.
- **Contenido mínimo recomendado:** selección por presupuesto/ocasión cuando
  exista dato real, productos regalables, empaque disponible confirmado y guía
  breve.
- **Schema recomendado:** `CollectionPage`, `ItemList`, `BreadcrumbList`.
- **Enlaces internos recomendados:** libretas, stickers, planners, tienda y FAQ
  de envíos/regalos.
- **Riesgo de canibalización:** medio con una ruta legacy `/regalos`; definir
  canonical y redirect antes de publicar.
- **Prioridad:** alta.

### `/papeleria-para-journaling`

- **Intención de búsqueda:** aprender qué usar para journaling y comprar una
  selección adecuada.
- **Keyword principal:** papelería para journaling.
- **Keywords secundarias:** materiales para journaling, stickers para
  journaling, libreta para bullet journal, accesorios de journaling.
- **Tipo de página:** hub híbrido editorial/comercial.
- **Indexable:** sí, cuando tenga contenido útil y productos relacionados.
- **Depende de colección Shopify:** parcialmente; puede usar una colección
  curada o múltiples categorías.
- **Contenido mínimo recomendado:** explicación, kit inicial, criterios de
  elección, técnicas básicas, productos reales y preguntas frecuentes.
- **Schema recomendado:** `CollectionPage` o `Article` según predominio,
  `ItemList`, `BreadcrumbList`; evitar mezclar tipos sin contenido visible.
- **Enlaces internos recomendados:** libretas, stickers, planners, productos y
  FAQ.
- **Riesgo de canibalización:** medio con stickers y libretas si se replica la
  descripción de esas categorías.
- **Prioridad:** media.

### `/papeleria-vina-del-mar`

- **Intención de búsqueda:** encontrar papelería/local OLFFY en Viña del Mar.
- **Keyword principal:** papelería Viña del Mar.
- **Keywords secundarias:** tienda de papelería Viña del Mar, papelería creativa
  Viña del Mar, regalos Viña del Mar.
- **Tipo de página:** landing GEO/local.
- **Indexable:** sí solo con información local verificable.
- **Depende de colección Shopify:** no, aunque puede destacar productos.
- **Contenido mínimo recomendado:** relación real con Viña del Mar, modalidad de
  compra/retiro confirmada, zona atendida, contacto, mapa/dirección solo si son
  públicos y vigentes, y preguntas locales.
- **Schema recomendado:** `LocalBusiness` únicamente con nombre, dirección,
  teléfono y horarios verificados; de lo contrario `Organization` y
  `BreadcrumbList`.
- **Enlaces internos recomendados:** tienda, contacto, sobre OLFFY, regalos y
  categorías principales.
- **Riesgo de canibalización:** medio con home si ambas atacan exactamente la
  misma consulta local.
- **Prioridad:** media.

### `/cuadernos-y-libretas`

- **Intención de búsqueda:** explorar una categoría amplia de cuadernos y
  libretas.
- **Keyword principal:** cuadernos y libretas.
- **Keywords secundarias:** cuadernos bonitos, libretas creativas, cuadernos
  ilustrados.
- **Tipo de página:** posible hub superior.
- **Indexable:** no inicialmente. Recomendar redirect 301 o canonical a
  `/libretas` mientras no exista una taxonomía diferenciada.
- **Depende de colección Shopify:** sí si se habilita en el futuro.
- **Contenido mínimo recomendado:** para indexarse deberá incluir surtido de
  cuadernos distinto, subcategorías, comparación y navegación que no exista en
  `/libretas`.
- **Schema recomendado:** ninguno mientras redirija; `CollectionPage`,
  `ItemList` y `BreadcrumbList` si se diferencia.
- **Enlaces internos recomendados:** libretas, journaling, planners y tienda.
- **Riesgo de canibalización:** alto.
- **Prioridad:** baja hasta resolver taxonomía.

### `/preguntas-frecuentes`

- **Intención de búsqueda:** resolver dudas de compra, envío, retiro, productos
  y puntos.
- **Keyword principal:** preguntas frecuentes OLFFY.
- **Keywords secundarias:** envíos OLFFY, cambios OLFFY, puntos OLFFY, cuidado
  de papelería.
- **Tipo de página:** soporte informativo.
- **Indexable:** sí si contiene respuestas sustantivas y vigentes.
- **Depende de colección Shopify:** no.
- **Contenido mínimo recomendado:** preguntas agrupadas por compra, despacho,
  producto, cuenta y puntos; enlaces a políticas y contacto.
- **Schema recomendado:** `FAQPage` solo para preguntas/respuestas visibles y
  sin contenido promocional engañoso; `BreadcrumbList`.
- **Enlaces internos recomendados:** contacto, tienda, categorías, cuenta,
  envíos, privacidad y términos.
- **Riesgo de canibalización:** bajo; evitar duplicar políticas completas.
- **Prioridad:** media.

### `/sobre-olffy`

- **Intención de búsqueda:** conocer la marca, origen y propuesta.
- **Keyword principal:** sobre OLFFY.
- **Keywords secundarias:** OLFFY papelería chilena, marca de papelería Viña del
  Mar, historia OLFFY.
- **Tipo de página:** página de marca/E-E-A-T.
- **Indexable:** sí.
- **Depende de colección Shopify:** no.
- **Contenido mínimo recomendado:** historia verificable, equipo/autores cuando
  se autorice, proceso, relación local, valores concretos y enlaces de contacto.
- **Schema recomendado:** `AboutPage`, `Organization`, `BreadcrumbList`.
- **Enlaces internos recomendados:** home, tienda, contacto, landing local y
  categorías.
- **Riesgo de canibalización:** alto con `/nuestra-historia`; migrar con 301 o
  conservar una sola canónica.
- **Prioridad:** media.

### `/contacto`

- **Intención de búsqueda:** contactar a OLFFY o resolver una necesidad
  específica.
- **Keyword principal:** contacto OLFFY.
- **Keywords secundarias:** contacto papelería OLFFY, ayuda OLFFY, tienda OLFFY
  Viña del Mar.
- **Tipo de página:** contacto/soporte.
- **Indexable:** sí.
- **Depende de colección Shopify:** no.
- **Contenido mínimo recomendado:** canales reales, tiempos de respuesta
  prudentes, formulario, motivo de contacto y datos locales solo si están
  verificados.
- **Schema recomendado:** `ContactPage`, `Organization`, `BreadcrumbList`.
- **Enlaces internos recomendados:** FAQ, tienda, sobre OLFFY, políticas y
  landing local.
- **Riesgo de canibalización:** bajo.
- **Prioridad:** media.

## Mapa de enlaces internos recomendado

- Home enlaza a todas las categorías prioritarias y páginas de confianza.
- Tienda enlaza categorías; categorías enlazan productos y categorías
  complementarias.
- Producto enlaza su categoría canónica, una categoría de uso y productos
  relacionados.
- Journaling enlaza libretas, stickers y planners como subintenciones.
- Regalos enlaza categorías según ocasión sin duplicar sus textos.
- FAQ, Sobre OLFFY, landing local y Contacto se enlazan mutuamente cuando ayuden
  al usuario, sin crear bloques repetitivos.

## Dependencias antes de implementar

- Confirmar taxonomía y handles reales de colecciones Shopify.
- Definir redirect de `/regalos` a `/regalos-de-papeleria` o conservar una sola
  URL.
- Definir redirect de `/nuestra-historia` a `/sobre-olffy` o conservar una sola
  URL.
- Resolver `/libretas` frente a `/cuadernos-y-libretas`.
- Confirmar datos locales públicos antes de usar `LocalBusiness`.
- Crear briefs de contenido por ruta y aprobar claims de producto.
- Incorporar las nuevas rutas al sitemap solo cuando sean canónicas,
  indexables y estén publicadas.
