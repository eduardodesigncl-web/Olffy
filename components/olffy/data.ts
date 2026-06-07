export type OlffyProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  tag: string;
  image: string;
};

export const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Tienda", href: "/tienda" },
  { label: "Novedades", href: "/novedades" },
  { label: "Regalos", href: "/regalos" },
  { label: "Nuestra historia", href: "/nuestra-historia" },
  { label: "Contacto", href: "/contacto" },
];

export const products: OlffyProduct[] = [
  {
    id: "agenda-creativa",
    name: "Agenda creativa",
    price: 12990,
    category: "Agendas y planners",
    tag: "Favorito",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "planner-semanal",
    name: "Planner semanal",
    price: 8990,
    category: "Agendas y planners",
    tag: "Nuevo",
    image:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "set-stickers",
    name: "Set de stickers",
    price: 4990,
    category: "Stickers",
    tag: "Regalo",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "libreta-artista",
    name: "Libreta artista",
    price: 6990,
    category: "Cuadernos y libretas",
    tag: "Favorito",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "marcapaginas",
    name: "Marcapaginas ilustrado",
    price: 2990,
    category: "Marcapaginas",
    tag: "Nuevo",
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "notas-color",
    name: "Taquitos de notas",
    price: 3990,
    category: "Taquitos y notas",
    tag: "Oficina feliz",
    image:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "kit-papeleria",
    name: "Kit de papeleria",
    price: 14990,
    category: "Kits",
    tag: "Regalo",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "empaque-regalo",
    name: "Empaque para regalo",
    price: 2490,
    category: "Accesorios y empaque",
    tag: "Regalo",
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cuaderno-arte",
    name: "Cuaderno de arte",
    price: 9990,
    category: "Cuadernos y libretas",
    tag: "Local",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "calendario-pared",
    name: "Calendario de pared",
    price: 11990,
    category: "Agendas y planners",
    tag: "Nuevo",
    image:
      "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tarjetas-felicitacion",
    name: "Tarjetas de felicitacion",
    price: 3500,
    category: "Accesorios y empaque",
    tag: "Regalo",
    image:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "boligrafo-artistico",
    name: "Boligrafo artistico",
    price: 5990,
    category: "Accesorios y empaque",
    tag: "Favorito",
    image:
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=80",
  },
];

export const storyImages = [
  "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
];

export const categories = [
  "Agendas y planners",
  "Cuadernos y libretas",
  "Stickers",
  "Taquitos y notas",
  "Marcapaginas",
  "Accesorios y empaque",
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price);
}
