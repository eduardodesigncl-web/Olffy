import { AccountShell } from "components/customer/account-shell";
import { requireCustomerAccount } from "lib/customer/auth";

export default async function PrivateAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { customer } = await requireCustomerAccount();
  return <AccountShell customer={customer}>{children}</AccountShell>;
}
