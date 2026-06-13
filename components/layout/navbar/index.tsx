import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { OlffyLogo } from "components/olffy/brand-logo";
import { navItems } from "components/olffy/data";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-olffy-ink bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <div className="flex flex-1 items-center">
          <OlffyLogo compact />
        </div>
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 rounded-[6px] px-3 py-2 font-brand text-sm font-black text-olffy-ink transition hover:bg-olffy-cream"
              >
                {item.label}
                {item.label !== "Contacto" ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-1 items-center justify-end gap-3">
          <Link aria-label="Buscar" href="/tienda">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </Link>
          <Link aria-label="Cuenta" href="/cuenta">
            <UserIcon className="h-6 w-6" />
          </Link>
          <Link aria-label="Carrito" href="/carrito">
            <ShoppingBagIcon className="h-6 w-6" />
          </Link>
        </div>
      </nav>
      <div className="flex gap-2 overflow-x-auto border-t border-olffy-ink/10 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-olffy-cream px-4 py-2 font-brand text-sm font-black text-olffy-ink"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
