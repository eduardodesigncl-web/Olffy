"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useTransition } from "react";
import type { CartLine } from "../contracts/cart.types";
import { AppShell } from "../components/layout/AppShell";
import {
  decrementCartLineAction,
  goCheckoutAction,
  incrementCartLineAction,
  removeCartLineAction,
} from "./actions";

const navRoutes: Record<string, string> = {
  Inicio: "/",
  Tienda: "/tienda",
  Novedades: "/novedades",
  Regalos: "/regalos",
  "Nuestra historia": "/nuestra-historia",
  Contacto: "/contacto",
};

function activeNavFromPath(pathname: string) {
  if (pathname.startsWith("/tienda") || pathname.startsWith("/producto")) {
    return "Tienda";
  }
  if (pathname.startsWith("/novedades")) return "Novedades";
  if (pathname.startsWith("/regalos")) return "Regalos";
  if (pathname.startsWith("/nuestra-historia")) return "Nuestra historia";
  if (pathname.startsWith("/contacto")) return "Contacto";
  return "Inicio";
}

export function OlffyAppShellClient({
  children,
  cartLines,
}: {
  children: ReactNode;
  cartLines: CartLine[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function refreshAfter(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <AppShell
      activeNav={activeNavFromPath(pathname)}
      cartLines={cartLines}
      onNavChange={(nav) => {
        const route = navRoutes[nav];
        if (route) router.push(route);
      }}
      onSubNavClick={() => {
        if (!pathname.startsWith("/tienda")) router.push("/tienda");
      }}
      onCheckout={() => refreshAfter(goCheckoutAction)}
      onCartRemove={(lineId) =>
        refreshAfter(() => removeCartLineAction(lineId))
      }
      onCartIncrement={(lineId) =>
        refreshAfter(() => incrementCartLineAction(lineId))
      }
      onCartDecrement={(lineId) =>
        refreshAfter(() => decrementCartLineAction(lineId))
      }
      onAccountClick={() => router.push("/cuenta")}
      onAdminOpen={() => router.push("/admin")}
    >
      {children}
    </AppShell>
  );
}
