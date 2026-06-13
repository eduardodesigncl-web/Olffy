import {
  ArrowRightStartOnRectangleIcon,
  ClockIcon,
  GiftIcon,
  HomeIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import type { CustomerAccount } from "lib/customer/auth";
import Link from "next/link";
import { signOutCustomerAction } from "app/cuenta/actions";

const links = [
  { href: "/cuenta", label: "Resumen", icon: HomeIcon },
  { href: "/cuenta/historial", label: "Historial", icon: ClockIcon },
  { href: "/cuenta/recompensas", label: "Recompensas", icon: GiftIcon },
  { href: "/cuenta/canjes", label: "Mis canjes", icon: TicketIcon },
];

export function AccountShell({
  customer,
  children,
}: {
  customer: CustomerAccount;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-8 md:py-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-[8px] border-2 border-olffy-ink bg-white p-4 shadow-[5px_5px_0_#fab405]">
          <div className="border-b border-olffy-ink/15 px-2 pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-olffy-purple">
              Mi cuenta
            </p>
            <p className="mt-2 font-brand text-xl font-black text-olffy-ink">
              {customer.full_name || "Cliente OLFFY"}
            </p>
            <p className="mt-1 truncate text-xs text-olffy-muted">
              {customer.email}
            </p>
          </div>
          <nav className="mt-4 grid gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[6px] px-3 py-3 text-sm font-bold text-olffy-ink transition hover:bg-olffy-cream"
              >
                <Icon className="h-5 w-5 text-olffy-purple" />
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOutCustomerAction} className="mt-3">
            <button className="flex w-full items-center gap-3 rounded-[6px] px-3 py-3 text-left text-sm font-bold text-olffy-muted hover:bg-gray-100">
              <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              Cerrar sesion
            </button>
          </form>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
