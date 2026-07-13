"use client";

import { useState } from "react";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface ForgotPasswordPageProps {
  onSubmit: (email: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error?: string;
}

export function ForgotPasswordPage({
  onSubmit,
  onSwitchToLogin,
  error,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[28px] text-black/80"
          style={{ fontFamily: T.piepie }}
        >
          Recupera tu cuenta
        </h1>
        <p
          className="text-[14px] text-black/45"
          style={{ fontFamily: T.poppins }}
        >
          Te enviaremos un enlace seguro para crear una contraseña nueva.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600"
          style={{ fontFamily: T.poppins }}
        >
          {error}
        </p>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="recovery-email">
          Correo electrónico
        </label>
        <input
          id="recovery-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
      <button
        type="button"
        onClick={onSwitchToLogin}
        className="text-center text-[14px] underline"
        style={{ color: C.orange, fontFamily: T.poppins }}
      >
        Volver a iniciar sesión
      </button>
    </div>
  );
}
