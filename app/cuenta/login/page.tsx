import { AccountAuthClient } from "src/integration/AccountAuthClient";
import { OlffyShell } from "src/integration/OlffyShell";

export const metadata = {
  title: "Inicia sesión",
  robots: { index: false, follow: false },
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <OlffyShell>
      <AccountAuthClient
        initialMode={params.mode === "register" ? "register" : "login"}
        initialError={params.error}
      />
    </OlffyShell>
  );
}
