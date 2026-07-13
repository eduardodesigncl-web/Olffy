"use client";

import { useState } from "react";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface RegisterPageProps {
  onRegister: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  onSwitchToLogin: () => void;
  error?: string;
}

export function RegisterPage({
  onRegister,
  onSwitchToLogin,
  error,
}: RegisterPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await onRegister(name, email, password, passwordConfirmation);
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
          Crear cuenta
        </h1>
        <p
          className="text-[14px] text-black/45"
          style={{ fontFamily: T.poppins }}
        >
          Únete a la comunidad OLFFY y empieza a acumular puntos.
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
        <label className="sr-only" htmlFor="register-name">
          Nombre completo
        </label>
        <input
          id="register-name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre completo"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
        />
        <label className="sr-only" htmlFor="register-email">
          Correo electrónico
        </label>
        <input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-email"
        />
        <label className="sr-only" htmlFor="register-password">
          Contraseña
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña (mín. 8 caracteres)"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-password"
        />
        <label className="sr-only" htmlFor="register-password-confirmation">
          Repetir contraseña
        </label>
        <input
          id="register-password-confirmation"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          placeholder="Repite la contraseña"
          className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
      <p
        className="text-center text-[14px] text-black/45"
        style={{ fontFamily: T.poppins }}
      >
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="underline"
          style={{ color: C.orange }}
        >
          Inicia sesión
        </button>
      </p>
    </div>
  );
}
