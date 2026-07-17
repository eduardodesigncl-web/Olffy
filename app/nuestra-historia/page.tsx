import { HistoriaPageClient } from "src/olffy/integration/HistoriaPageClient";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Nuestra historia",
  description:
    "Conoce OLFFY: papelería ilustrada hecha a mano en Viña del Mar, pensada para organizar, crear y regalar.",
};

export default function StoryPage() {
  return (
    <OlffyStorefront>
      <HistoriaPageClient />
    </OlffyStorefront>
  );
}
