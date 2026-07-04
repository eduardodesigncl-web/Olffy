import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { UserIcon } from "@heroicons/react/24/outline";
import { getCart } from "lib/shopify";
import { OlffyCartDrawer } from "components/olffy/cart-drawer";
import type { Cart } from "lib/shopify/types";

const tickerItems = [
  "Envios a todo Chile 💛",
  "Retiro gratis en tienda",
  "✨ Viña del Mar",
  "Cuadernos, planners, stickers y papelería ilustrada",
  "Nuevas colecciones disponibles 📦",
];

const navLinks = [
  { href: "/", label: "Inicio" },
  {
    href: "/tienda",
    label: "Tienda",
    items: ["Cuadernos", "Planners", "Stickers", "Calendarios", "Regalos"],
  },
  {
    href: "/novedades",
    label: "Novedades",
    items: ["Nuevas colecciones", "Recién llegados", "Próximamente"],
  },
  {
    href: "/regalos",
    label: "Regalos",
    items: [
      "Para amigas",
      "Para estudiantes",
      "Kits de regalo",
      "Por presupuesto",
    ],
  },
  { href: "/nuestra-historia", label: "Nuestra historia" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
      <div className="overflow-hidden bg-[#4d4a96] text-white">
        <div className="olffy-marquee flex w-max">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex items-center gap-8 px-4 py-2 text-xs font-semibold"
              aria-hidden={group === 1}
            >
              {tickerItems.map((item) => (
                <span
                  key={`${group}-${item}`}
                  className="flex items-center gap-8"
                >
                  {item}
                  <span className="text-white/30">-</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <nav className="border-b border-olffy-ink/10 bg-white/95">
        <div className="relative mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3.5 px-4 lg:px-12">
          <Link href="/" className="flex shrink-0 items-start">
            <Image
              src="/olffy/logo.png"
              alt="OLFFY"
              width={120}
              height={40}
              priority
              className="h-[34px] w-auto object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(2000%) hue-rotate(13deg)",
              }}
            />
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((item) =>
              item.items ? (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 px-1 py-1.5 text-sm font-medium text-olffy-ink"
                  >
                    {item.label}
                    <span className="text-[10px] opacity-60">▾</span>
                  </Link>
                  <div className="pointer-events-none absolute left-1/2 top-full min-w-[180px] -translate-x-1/2 translate-y-[-4px] rounded-[14px] bg-white p-2 opacity-0 shadow-[0_8px_32px_rgba(0,0,0,.14)] transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                    {item.items.map((subitem) => (
                      <Link
                        key={subitem}
                        href={item.href}
                        className="block rounded-[9px] px-3.5 py-2.5 text-[13.5px] text-olffy-ink hover:bg-olffy-cream"
                      >
                        {subitem}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-1 py-1.5 text-sm font-medium text-olffy-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              aria-label="Cuenta"
              href="/cuenta"
              className="grid h-[37px] w-[37px] place-items-center rounded-[10px] text-olffy-ink"
            >
              <UserIcon className="h-[18px] w-[18px]" />
            </Link>
            <Suspense fallback={<OlffyCartDrawer />}>
              <CartDrawerServer />
            </Suspense>
          </div>
        </div>
      </nav>

      <div className="flex gap-2 overflow-x-auto border-b border-olffy-ink/10 bg-white px-4 py-2 lg:hidden">
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-[#fff5d9] px-4 py-2 text-sm font-semibold text-olffy-ink"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

async function CartDrawerServer() {
  await connection();

  let cart: Cart | undefined;

  try {
    cart = await getCart();
  } catch (error) {
    console.error("Could not load Shopify cart in navbar", error);
  }

  return <OlffyCartDrawer cart={cart} />;
}
