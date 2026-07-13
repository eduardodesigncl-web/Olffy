"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
  onResendConfirmation?: () => Promise<void>;
  error?: string;
  notice?: string;
}

export function LoginPage({
  onLogin,
  onForgotPassword,
  onSwitchToRegister,
  onResendConfirmation,
  error,
  notice,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!onResendConfirmation) return;
    setResending(true);
    try {
      await onResendConfirmation();
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[28px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Inicia sesión
        </h1>
        <p
          className="text-[14px] text-black/45"
          style={{ fontFamily: T.poppins }}
        >
          Accede a tu cuenta para ver tus pedidos y puntos.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600"
          style={{ fontFamily: T.poppins }}
        >
          <p>{error}</p>
          {onResendConfirmation && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-2 font-medium underline disabled:opacity-60"
            >
              {resending ? "Reenviando..." : "Reenviar confirmación"}
            </button>
          )}
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-700"
          style={{ fontFamily: T.poppins }}
        >
          {notice}
        </p>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="customer-email">
          Correo electrónico
        </label>
        <input
          id="customer-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none transition-colors focus:border-black/40"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-email"
        />
        <div className="relative">
          <label className="sr-only" htmlFor="customer-password">
            Contraseña
          </label>
          <input
            id="customer-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-xl border border-black/12 px-4 py-3 pr-12 text-[14px] outline-none transition-colors focus:border-black/40"
            style={{ fontFamily: T.poppins }}
            data-bind="supabase-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-black/35 transition-colors hover:text-black/60"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="button"
          onClick={onForgotPassword}
          className="self-end text-[13px] underline"
          style={{ color: C.orange, fontFamily: T.poppins }}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p
        className="text-center text-[14px] text-black/45"
        style={{ fontFamily: T.poppins }}
      >
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="underline"
          style={{ color: C.orange }}
        >
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}
