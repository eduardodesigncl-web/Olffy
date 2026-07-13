import { AccountAuthClient } from "src/integration/AccountAuthClient";
import { OlffyShell } from "src/integration/OlffyShell";
import { safeCustomerReturnUrl } from "lib/customer/return-url";

export const metadata = {
  title: "Inicia sesión",
  robots: { index: false, follow: false },
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    error?: string;
    next?: string;
    passwordUpdated?: string;
    signedOut?: string;
  }>;
}) {
  const params = await searchParams;

  const initialNotice = params.passwordUpdated
    ? "Tu contraseña fue actualizada. Ya puedes iniciar sesión."
    : params.signedOut
      ? "Tu sesión se cerró correctamente."
      : undefined;

  return (
    <OlffyShell>
      <AccountAuthClient
        initialMode={params.mode === "register" ? "register" : "login"}
        initialError={params.error}
        initialNotice={initialNotice}
        returnTo={safeCustomerReturnUrl(params.next)}
      />
    </OlffyShell>
  );
}
