import { Suspense } from "react";
import { AdminShell } from "components/admin/admin-shell";
import AdminLoading from "./loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
