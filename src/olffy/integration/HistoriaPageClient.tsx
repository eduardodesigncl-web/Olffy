"use client";

import { useRouter } from "next/navigation";
import { HistoriaPage } from "../pages/HistoriaPage";
import { PAGE_ROUTES } from "./OlffyChrome";

export function HistoriaPageClient() {
  const router = useRouter();

  return <HistoriaPage onNavigate={(page) => router.push(PAGE_ROUTES[page])} />;
}
