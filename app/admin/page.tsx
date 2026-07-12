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
  const actor = await requireAdminPageSession();
  await connection();

  const { tab } = await searchParams;
  const allowedTabs = VALID_TABS.filter((item) =>
    actor.permissions.includes(item),
  );
  const initialTab =
    VALID_TABS.includes(tab as AdminTab) &&
    allowedTabs.includes(tab as AdminTab)
      ? (tab as AdminTab)
      : (allowedTabs[0] ?? "dashboard");
  const data = await getAdminPanelData();

  return (
    <AdminPanelClient
      data={data}
      initialTab={initialTab}
      allowedTabs={allowedTabs}
    />
  );
}
