import { requireAdminPageSession } from "lib/admin/auth";

export default async function LoyaltyAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPageSession();

  return children;
}
