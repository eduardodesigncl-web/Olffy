import type { EmailOtpType } from "@supabase/supabase-js";
import { completeVerifiedCustomerAccount } from "lib/customer/auth";
import { hasSupabasePublicConfig } from "lib/supabase/config";
import { getSupabaseServer } from "lib/supabase/server";
import { NextResponse } from "next/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/cuenta";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL(
        `/cuenta/login?error=${encodeURIComponent("La autenticacion de cliente no esta configurada.")}`,
        url.origin,
      ),
    );
  }

  const supabase = await getSupabaseServer();

  let error: Error | null = null;

  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error(
      "El enlace de acceso no contiene una verificacion valida.",
    );
  }

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/cuenta/login?error=${encodeURIComponent("El enlace expiro o ya fue utilizado.")}`,
        url.origin,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let customer = null;

  try {
    customer = user ? await completeVerifiedCustomerAccount(user) : null;
  } catch (cause) {
    console.error("No se pudo vincular la cuenta de cliente.", cause);
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL(
        `/cuenta/login?error=${encodeURIComponent(
          "No pudimos vincular tu cuenta. Contacta a OLFFY.",
        )}`,
        url.origin,
      ),
    );
  }

  if (!user || !customer) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/cuenta/login?error=no-inscrita", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
