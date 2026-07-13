"use client";

import { updateCustomerPasswordAction } from "app/cuenta/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

const C = { orange: "#e94300" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

export function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    try {
      const result = await updateCustomerPasswordAction({
        password,
        passwordConfirmation,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace("/cuenta/login?passwordUpdated=1");
      router.refresh();
    } catch {
      setError("No pudimos actualizar la contraseña. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1
            className="text-[28px] text-black/80"
            style={{ fontFamily: T.piepie }}
          >
            Crea una contraseña nueva
          </h1>
          <p
            className="text-[14px] text-black/45"
            style={{ fontFamily: T.poppins }}
          >
            Usa al menos 8 caracteres y evita reutilizar contraseñas.
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
          <label className="sr-only" htmlFor="new-password">
            Contraseña nueva
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña nueva"
            className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
            style={{ fontFamily: T.poppins }}
          />
          <label className="sr-only" htmlFor="new-password-confirmation">
            Repetir contraseña nueva
          </label>
          <input
            id="new-password-confirmation"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="Repite la contraseña nueva"
            className="rounded-xl border border-black/12 px-4 py-3 text-[14px] outline-none focus:border-black/40"
            style={{ fontFamily: T.poppins }}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full py-3 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: T.poppins, background: C.orange }}
          >
            {loading ? "Actualizando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
