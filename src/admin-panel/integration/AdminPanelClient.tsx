"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "../pages/admin/AdminPage";
import { hydrateAdminPanelData } from "./hydrate-admin-panel-data";
import type { AdminPanelData } from "./types";

export function AdminPanelClient({ data }: { data: AdminPanelData }) {
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

  return <AdminPage onExit={handleExit} />;
}
