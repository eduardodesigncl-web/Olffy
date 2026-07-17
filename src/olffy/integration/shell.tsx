// Shell del storefront oficial. Es síncrono a propósito: el chrome (navbar,
// footer, drawers) y el contenido de la página se pintan de inmediato desde
// el HTML estático, y el carrito se hidrata después en el cliente
// (ver CartContext + getCartItemsAction). No bloquear acá es lo que permite
// que las páginas queden 100% prerenderizadas.
import { ReactNode } from "react";
import { OlffyChrome } from "./OlffyChrome";

export function OlffyStorefront({ children }: { children: ReactNode }) {
  return <OlffyChrome>{children}</OlffyChrome>;
}
