import { hasAdminSession } from "lib/admin/auth";
import { redirect } from "next/navigation";

export default async function LoyaltyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  return children;
}
