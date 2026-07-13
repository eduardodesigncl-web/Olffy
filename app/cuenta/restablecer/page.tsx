import { CUSTOMER_RECOVERY_COOKIE } from "lib/customer/recovery";
import { getSupabaseServer } from "lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordClient } from "src/integration/ResetPasswordClient";
import { OlffyShell } from "src/integration/OlffyShell";

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

  if (!user || !cookieStore.has(CUSTOMER_RECOVERY_COOKIE)) {
    redirect(
      `/cuenta/login?error=${encodeURIComponent(
        "El enlace de recuperación expiró o ya fue utilizado.",
      )}`,
    );
  }

  return (
    <OlffyShell>
      <ResetPasswordClient />
    </OlffyShell>
  );
}
