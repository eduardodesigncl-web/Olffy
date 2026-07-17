import { ContactoPageClient } from "src/olffy/integration/ContactoPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Contacto",
  description:
    "Escríbenos: dudas sobre pedidos, productos o coordinaciones especiales con OLFFY.",
};

export default function ContactPage() {
  return (
    <OlffyStorefront>
      <ContactoPageClient />
    </OlffyStorefront>
  );
}
