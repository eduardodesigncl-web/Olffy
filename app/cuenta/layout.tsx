import { Suspense } from "react";
import AccountLoading from "./loading";

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <Suspense fallback={<AccountLoading />}>{children}</Suspense>
    </div>
  );
}
