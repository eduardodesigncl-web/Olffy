"use client";

import {
  loginCustomerAction,
  registerCustomerAction,
  requestCustomerPasswordRecoveryAction,
  resendCustomerConfirmationAction,
} from "app/cuenta/actions";
import { safeCustomerReturnUrl } from "lib/customer/return-url";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ForgotPasswordPage } from "src/components/customer/ForgotPasswordPage";
import { LoginPage } from "src/components/customer/LoginPage";
import { RegisterPage } from "src/components/customer/RegisterPage";

type AuthMode = "login" | "register" | "forgot";

export function AccountAuthClient({
  initialMode = "login",
  initialError,
  initialNotice,
  returnTo = "/cuenta",
}: {
  initialMode?: "login" | "register";
  initialError?: string;
  initialNotice?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState(initialNotice);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );

  const safeReturnTo = safeCustomerReturnUrl(returnTo);

  function resetFeedback() {
    setError(undefined);
    setNotice(undefined);
    setConfirmationEmail(null);
  }

  async function login(email: string, password: string) {
    resetFeedback();

    try {
      const result = await loginCustomerAction({ email, password });

      if (!result.ok) {
        setError(result.error);
        if (result.code === "email_not_confirmed") {
          setConfirmationEmail(email.trim().toLowerCase());
        }
        return;
      }

      router.replace(safeReturnTo);
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Intenta nuevamente.");
    }
  }

  async function register(
    fullName: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) {
    resetFeedback();

    try {
      const result = await registerCustomerAction({
        fullName,
        email,
        password,
        passwordConfirmation,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMode("login");
      setNotice(result.message);
    } catch {
      setError("No pudimos completar el registro. Intenta nuevamente.");
    }
  }

  async function requestRecovery(email: string) {
    resetFeedback();

    try {
      const result = await requestCustomerPasswordRecoveryAction({ email });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMode("login");
      setNotice(result.message);
    } catch {
      setError("No pudimos solicitar la recuperación. Intenta nuevamente.");
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail) return;

    try {
      const result = await resendCustomerConfirmationAction({
        email: confirmationEmail,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError(undefined);
      setNotice(result.message);
      setConfirmationEmail(null);
    } catch {
      setError("No pudimos reenviar la confirmación. Intenta nuevamente.");
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16">
      {mode === "login" ? (
        <LoginPage
          onLogin={login}
          onForgotPassword={() => {
            setMode("forgot");
            resetFeedback();
          }}
          onResendConfirmation={
            confirmationEmail ? resendConfirmation : undefined
          }
          onSwitchToRegister={() => {
            setMode("register");
            resetFeedback();
          }}
          error={error}
          notice={notice}
        />
      ) : mode === "register" ? (
        <RegisterPage
          onRegister={register}
          onSwitchToLogin={() => {
            setMode("login");
            resetFeedback();
          }}
          error={error}
        />
      ) : (
        <ForgotPasswordPage
          onSubmit={requestRecovery}
          onSwitchToLogin={() => {
            setMode("login");
            resetFeedback();
          }}
          error={error}
        />
      )}
    </div>
  );
}
