import { requireAdminPageSession } from "lib/admin/auth";
import { connection } from "next/server";
import { getAdminPanelData } from "src/admin-panel/integration/get-admin-panel-data";
import { AdminPanelClient } from "src/admin-panel/integration/AdminPanelClient";
import type { AdminTab } from "src/admin-panel/components/admin";

const VALID_TABS: AdminTab[] = [
  "dashboard",
  "clientes",
  "ventas",
  "pos",
  "puntos",
  "recompensas",
  "productos",
  "colecciones",
  "ajustes",
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPageSession();
  await connection();

  const { tab } = await searchParams;
  const initialTab = VALID_TABS.includes(tab as AdminTab)
    ? (tab as AdminTab)
    : "dashboard";
  const data = await getAdminPanelData();

  return <AdminPanelClient data={data} initialTab={initialTab} />;
}
