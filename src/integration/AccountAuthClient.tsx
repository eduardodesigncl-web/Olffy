"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "lib/supabase/browser";
import { requestMagicLink } from "../adapters/frontend-actions";
import { LoginPage } from "../components/customer/LoginPage";
import { RegisterPage } from "../components/customer/RegisterPage";

export function AccountAuthClient({
  initialMode = "login",
  initialError,
}: {
  initialMode?: "login" | "register";
  initialError?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState(initialError);

  async function login(email: string, _password: string) {
    setError(undefined);

    try {
      await requestMagicLink(email);
      setError("Te enviamos un enlace de acceso a tu correo.");
    } catch {
      setError("No pudimos enviar el enlace de acceso. Intenta nuevamente.");
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(undefined);
    const supabase = getSupabaseBrowser();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
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
