import { Suspense } from "react";
import { AdminChromeGuard } from "components/admin/admin-chrome-guard";
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
      <AdminChromeGuard />
      {children}
    </Suspense>
  );
}
