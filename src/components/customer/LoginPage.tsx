// @ts-nocheck
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  error?: string;
}

export function LoginPage({
  onLogin,
  onSwitchToRegister,
  error,
}: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
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
        <p
          className="text-[13px] text-red-500 px-3 py-2 rounded-lg bg-red-50"
          style={{ fontFamily: T.poppins }}
        >
          {error}
        </p>
      )}
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="px-4 py-3 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40 transition-colors"
          style={{ fontFamily: T.poppins }}
          data-bind="supabase-email"
        />
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 pr-12 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/40 transition-colors"
            style={{ fontFamily: T.poppins }}
            data-bind="supabase-password"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/35 hover:text-black/60 transition-colors"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-3 rounded-full text-white text-[15px] font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ fontFamily: T.poppins, background: C.orange }}
          data-action="request-magic-link"
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
