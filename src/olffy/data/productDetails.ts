import type { Product } from '../types';

// Capa derivada para las páginas de detalle de producto (/tienda/<handle>).
// Calcula vistas de galería, previews de interior, contenido extendido y
// relacionados a partir del catálogo real (Shopify). Cuando existan assets
// reales (fotos/spreads), cada vista y página interior acepta un `src`
// opcional sin cambiar la estructura.

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// En el port de Next.js la ruta de detalle usa el handle real de Shopify.
export function productSlug(product: Product): string {
  return product.handle || slugify(product.name);
}

// ── Galería ──────────────────────────────────────────────────────────────
export type GalleryViewId = 'portada' | 'reverso' | 'detalle' | 'uso';

export interface GalleryView {
  id: GalleryViewId;
  label: string;
  // Imagen real (cuando exista). Sin src se dibuja la composición mock.
  src?: string;
}

export const GALLERY_VIEWS: GalleryView[] = [
  { id: 'portada', label: 'Portada' },
  { id: 'reverso', label: 'Reverso' },
  { id: 'detalle', label: 'Detalle' },
  { id: 'uso', label: 'En uso' },
];

// ── Visor de interior (tipo libro abierto) ───────────────────────────────
export type InteriorType =
  | 'semanal'
  | 'mensual'
  | 'punteado'
  | 'rayado'
  | 'notas'
  | 'papel'
  | 'ilustracion'
  | 'stickers';

export interface InteriorTab {
  id: InteriorType;
  label: string;
  src?: string;
}

// Qué interior mostrar según el tipo de producto (categorías reales de las
// colecciones Shopify: Cuadernos, Libretas, Planners, Stickers, Tacos de
// Notas, FlashCards, Marcapáginas, Empaque…). Si devuelve [], la sección de
// interior no aparece.
export function interiorTabsFor(product: Product): InteriorTab[] {
  const cat = product.cat.toLowerCase();
  const name = product.name.toLowerCase();
  const context = `${cat} ${name} ${product.desc} ${product.fullDesc ?? ''} ${product.specs
    .map((s) => `${s.l} ${s.v}`)
    .join(' ')}`.toLowerCase();

  // Planners / cuadernos de planificación / agendas / calendarios.
  if (
    cat.includes('planner') ||
    /agenda|planner|plan mensual|plan semanal|calendario/.test(name)
  ) {
    const tabs: InteriorTab[] = [];
    if (/diaria/.test(context)) {
      tabs.push({ id: 'notas', label: 'Vista diaria' });
    } else if (/semanal/.test(context)) {
      tabs.push({ id: 'semanal', label: 'Vista semanal' });
    }
    tabs.push({ id: 'mensual', label: 'Vista mensual' });
    tabs.push({ id: 'notas', label: 'Notas' });
    tabs.push({ id: 'papel', label: 'Papel' });
    // ids únicos para keys: dedup conservando orden
    return dedupTabs(tabs);
  }

  // Cuadernos y libretas: hoja rayada/punteada/cuadriculada + extras.
  if (cat.includes('cuaderno') || cat.includes('libreta') || /cuaderno|libreta/.test(name)) {
    const ruling: InteriorTab = /puntead|dot/.test(context)
      ? { id: 'punteado', label: 'Hoja punteada' }
      : { id: 'rayado', label: /cuadricul/.test(context) ? 'Hoja cuadriculada' : 'Hoja rayada' };
    const tabs: InteriorTab[] = [];
    // Muchos cuadernos OLFFY traen planificación mensual además de hojas.
    if (/planificaci[oó]n mensual|planner mensual|plan mensual/.test(context)) {
      tabs.push({ id: 'mensual', label: 'Plan mensual' });
    }
    tabs.push(ruling, { id: 'ilustracion', label: 'Ilustración' }, { id: 'notas', label: 'Notas' }, { id: 'papel', label: 'Papel' });
    return dedupTabs(tabs);
  }

  if (cat.includes('sticker') || /sticker/.test(name)) {
    return [
      { id: 'stickers', label: 'Plancha' },
      { id: 'ilustracion', label: 'Diseños' },
    ];
  }

  // Tacos de notas, checklists y flashcards: hojas para escribir.
  if (
    cat.includes('taco') ||
    cat.includes('flashcard') ||
    /taquito|checklist|flashcard|notas/.test(name)
  ) {
    return [
      { id: 'notas', label: 'Hoja de notas' },
      { id: 'ilustracion', label: 'Ilustración' },
      { id: 'papel', label: 'Papel' },
    ];
  }

  // Marcapáginas, tarjetas y libros de colorear: la ilustración es el interior.
  if (
    cat.includes('marcap') ||
    cat.includes('empaque') ||
    /marcap[aá]gina|tarjeta|colorear/.test(name)
  ) {
    return [
      { id: 'ilustracion', label: 'Ilustración' },
      { id: 'papel', label: 'Papel' },
    ];
  }

  return [];
}

function dedupTabs(tabs: InteriorTab[]): InteriorTab[] {
  const seen = new Set<string>();
  return tabs.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}

// ── Contenido extendido (acordeones) ─────────────────────────────────────
export interface DetailSection {
  id: string;
  question: string;
  answer: string;
}

// Textos "Qué incluye" por categoría real (colecciones Shopify). Las claves
// se comparan en minúsculas y por inclusión (p. ej. "Tacos de Notas").
const INCLUDES_BY_CAT: [string, string][] = [
  ['cuaderno', 'Cuaderno con tapa ilustrada, encuadernación resistente y páginas interiores listas para tus ideas.'],
  ['libreta', 'Libreta con tapa ilustrada y hojas interiores para notas, ideas y listas del día.'],
  ['planner', 'Planner con interior organizado, portadas ilustradas y espacio de notas para cada periodo.'],
  ['sticker', 'Plancha(s) de stickers troquelados, listos para despegar y usar donde quieras.'],
  ['calendario', 'Calendario con una ilustración original por mes, listo para colgar.'],
  ['taco', 'Taco de hojas ilustradas para notas rápidas, listas y recados.'],
  ['flashcard', 'Set de tarjetas/flashcards sueltas para apuntes, estudio y mensajes.'],
  ['marcap', 'Marcapáginas ilustrado, perfecto para acompañar tus lecturas.'],
  ['empaque', 'Tarjeta ilustrada con sobre, lista para escribir y regalar.'],
  ['regalo', 'Producto(s) seleccionados y empacados en caja de regalo OLFFY.'],
];

const CARE_BY_CAT: [string, string][] = [
  ['sticker', 'Vinilo resistente. Aplica sobre superficies limpias y secas; evita reposicionar muchas veces.'],
  ['escritura', 'Mantén los lápices en su estuche y lejos de la humedad para conservar el pigmento.'],
];

function byCategory(
  entries: [string, string][],
  cat: string,
): string | undefined {
  const normalized = cat.toLowerCase();
  return entries.find(([key]) => normalized.includes(key))?.[1];
}

export function detailSectionsFor(product: Product): DetailSection[] {
  return [
    {
      id: 'incluye',
      question: 'Qué incluye',
      answer:
        byCategory(INCLUDES_BY_CAT, product.cat) ??
        'Producto OLFFY empacado a mano, listo para usar o regalar.',
    },
    {
      id: 'materiales',
      question: 'Materiales y cuidados',
      answer:
        byCategory(CARE_BY_CAT, product.cat) ??
        'Papeles y materiales seleccionados de buena calidad. Guárdalo lejos de la humedad y la luz directa para que dure mucho más.',
    },
    {
      id: 'envios',
      question: 'Envíos y retiros',
      answer: 'Envíos a todo Chile (2 a 5 días hábiles según región). Retiro gratis en nuestra tienda de Viña del Mar, listo el mismo día.',
    },
    {
      id: 'cambios',
      question: 'Cambios y devoluciones',
      answer: 'Tienes 10 días para cambios si el producto está sin uso y en su empaque original. Escríbenos por la página de contacto y lo resolvemos con cariño.',
    },
  ];
}

// ── Relacionados ─────────────────────────────────────────────────────────
export function relatedProductsFor(
  product: Product,
  catalog: Product[],
  max = 4,
): Product[] {
  const sameCat = catalog.filter((p) => p.id !== product.id && p.cat === product.cat);
  const others = catalog.filter((p) => p.id !== product.id && p.cat !== product.cat);
  return [...sameCat, ...others].slice(0, max);
}
