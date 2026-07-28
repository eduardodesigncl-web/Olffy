import {
  CUSTOMER_RECOVERY_COOKIE,
  CUSTOMER_RECOVERY_COOKIE_VALUE,
} from "lib/customer/recovery";
import { getSupabaseServer } from "lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PuntosLanding } from "src/olffy/integration/PuntosLanding";
import { OlffyStorefront } from "src/olffy/integration/shell";

export const metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default async function CustomerResetPasswordPage() {
  const cookieStore = await cookies();
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    cookieStore.get(CUSTOMER_RECOVERY_COOKIE)?.value !==
      CUSTOMER_RECOVERY_COOKIE_VALUE
  ) {
    redirect(
      `/cuenta/login?error=${encodeURIComponent(
        "El enlace de recuperación expiró o ya fue utilizado.",
      )}`,
    );
  }

  return (
    <OlffyStorefront>
      <PuntosLanding variant="reset" />
    </OlffyStorefront>
  );
}
