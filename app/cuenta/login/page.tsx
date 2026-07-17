import { safeCustomerReturnUrl } from "lib/customer/return-url";
import { PuntosLanding } from "src/olffy/integration/PuntosLanding";
import { OlffyStorefront } from "src/olffy/integration/shell";

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

  const initialError =
    params.error === "no-inscrita"
      ? "No pudimos vincular tu cuenta de puntos. Contacta a OLFFY."
      : params.error;

  const returnTo = safeCustomerReturnUrl(params.next);

  return (
    <OlffyStorefront>
      <PuntosLanding
        variant="auth"
        initialMode={params.mode === "register" ? "signup" : "login"}
        {...(initialError ? { initialError } : {})}
        {...(initialNotice ? { initialNotice } : {})}
        {...(returnTo ? { returnTo } : {})}
      />
    </OlffyStorefront>
  );
}
