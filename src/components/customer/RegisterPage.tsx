// @ts-nocheck
import { useState } from "react";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onRegister(name, email, password);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
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
          className="text-[13px] text-red-500 px-3 py-2 rounded-lg bg-red-50"
          style={{ fontFamily: T.poppins }}
        >
          {error}
        </p>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          className="px-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="px-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-email"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 8 caracteres)"
          minLength={8}
          className="px-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="py-3 rounded-full text-white text-[15px] font-medium disabled:opacity-60 hover:opacity-90 transition-opacity"
          style={{ fontFamily: T.poppins, background: C.orange }}
          data-action="request-magic-link"
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
