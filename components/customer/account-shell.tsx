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
    <div className="px-6 py-10 md:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-olffy-ink/10 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,.05)]">
          <div className="pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-olffy-ink/35">
              Mi cuenta
            </p>
            <p className="mt-1 font-brand text-[16px] font-bold text-olffy-ink/90">
              {customer.full_name || "Cliente OLFFY"}
            </p>
            <p className="mt-1 truncate text-[13px] text-olffy-ink/45">
              {customer.email}
            </p>
          </div>
          <nav className="mt-6 grid gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-olffy-ink/65 transition hover:bg-olffy-purple/10 hover:text-olffy-purple"
              >
                <Icon className="h-4 w-4 text-olffy-purple" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="my-4 h-px bg-olffy-ink/10" />
          <form action={signOutCustomerAction}>
            <button className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-left text-[13px] text-olffy-ink/40 transition hover:bg-gray-100">
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              Cerrar sesion
            </button>
          </form>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
