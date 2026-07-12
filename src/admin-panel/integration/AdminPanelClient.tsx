"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "../pages/admin/AdminPage";
import type { AdminTab } from "../components/admin";
import { hydrateAdminPanelData } from "./hydrate-admin-panel-data";
import type { AdminPanelData } from "./types";

export function AdminPanelClient({
  data,
  initialTab = "dashboard",
  navigationMode = "client",
  allowedTabs,
}: {
  data: AdminPanelData;
  initialTab?: AdminTab;
  navigationMode?: "client" | "routes";
  allowedTabs: AdminTab[];
}) {
  const router = useRouter();

  useMemo(() => hydrateAdminPanelData(data), [data]);

  const handleExit = async () => {
    await fetch("/api/admin/auth", {
      method: "DELETE",
      credentials: "include",
    });
    router.push("/");
    router.refresh();
  };

  const handleTabRequest = (tab: AdminTab) => {
    if (!allowedTabs.includes(tab)) return;
    if (tab === "dashboard") router.push("/admin");
    else if (tab === "ventas") router.push("/admin/ventas");
    else if (tab === "pos") router.push("/admin/pos");
    else router.push(`/admin?tab=${tab}`);
  };

  return (
    <AdminPage
      onExit={handleExit}
      initialTab={initialTab}
      onTabRequest={navigationMode === "routes" ? handleTabRequest : undefined}
      allowedTabs={allowedTabs}
    />
  );
}
