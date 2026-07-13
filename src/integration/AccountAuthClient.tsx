"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "lib/supabase/browser";
import { safeCustomerReturnUrl } from "lib/customer/return-url";
import { LoginPage } from "../components/customer/LoginPage";
import { RegisterPage } from "../components/customer/RegisterPage";

export function AccountAuthClient({
  initialMode = "login",
  initialError,
  returnTo = "/cuenta",
}: {
  initialMode?: "login" | "register";
  initialError?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState(initialError);

  const safeReturnTo = safeCustomerReturnUrl(returnTo);

  async function login(email: string, password: string) {
    setError(undefined);

    try {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      router.replace(safeReturnTo);
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.toLowerCase() : "";
      setError(
        message.includes("invalid login credentials")
          ? "El correo o la contraseña no son correctos."
          : "No pudimos iniciar sesión. Intenta nuevamente.",
      );
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(undefined);
    const supabase = getSupabaseBrowser();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm?next=${encodeURIComponent(safeReturnTo)}`,
        data: {
          full_name: name.trim(),
          registration_source: "customer_account",
        },
      },
    });

    if (signUpError) {
      setError("No pudimos completar el registro. Intenta nuevamente.");
      return;
    }

    setMode("login");
    setError("Revisa tu correo para confirmar la cuenta antes de entrar.");
  }

  return (
    <div className="min-h-[70vh] bg-white px-6 py-16 flex items-center justify-center">
      {mode === "login" ? (
        <LoginPage
          onLogin={login}
          onSwitchToRegister={() => {
            setMode("register");
            setError(undefined);
          }}
          error={error}
        />
      ) : (
        <RegisterPage
          onRegister={register}
          onSwitchToLogin={() => {
            setMode("login");
            setError(undefined);
          }}
          error={error}
        />
      )}
    </div>
  );
}
