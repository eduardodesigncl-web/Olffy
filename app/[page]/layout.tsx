import { OlffyStorefront } from "src/olffy/integration/shell";

// Páginas legales/de ayuda con el chrome del frontend oficial (navbar,
// footer y carrito reales).
export default function Layout({ children }: { children: React.ReactNode }) {
  return <OlffyStorefront>{children}</OlffyStorefront>;
}
