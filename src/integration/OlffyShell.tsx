import { ReactNode, Suspense } from "react";
import { getCart } from "lib/shopify";
import { toFrontendCartLines } from "./mappers";
import { OlffyAppShellClient } from "./OlffyAppShellClient";

export function OlffyShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <OlffyShellContent>{children}</OlffyShellContent>
    </Suspense>
  );
}

async function OlffyShellContent({ children }: { children: ReactNode }) {
  const cart = await getCart();

  return (
    <OlffyAppShellClient cartLines={toFrontendCartLines(cart)}>
      {children}
    </OlffyAppShellClient>
  );
}
