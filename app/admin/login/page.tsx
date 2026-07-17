"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "src/shared/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Contraseña incorrecta");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 sm:px-6 lg:px-8">
      {/* Volver al sitio público desde el acceso restringido. */}
      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-xl border border-olffy-ink/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-olffy-ink/70 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition hover:text-olffy-ink"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Volver a la web
      </Link>
      <div className="w-full max-w-[400px] rounded-2xl border border-olffy-ink/10 bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,.07)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olffy-orange">
            Acceso restringido
          </p>
          <h2 className="mt-2 font-brand text-[28px] font-bold text-olffy-ink/90">
            Admin Panel
          </h2>
          <p className="mt-1 text-[13px] text-olffy-ink/50">
            Solo personal autorizado de OLFFY.
          </p>
        </div>
        <form className="mt-6 space-y-5" method="post" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[12px] text-olffy-ink/55">
              Email de la cuenta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-olffy-ink/15 px-4 py-3 text-sm text-olffy-ink outline-none transition focus:border-olffy-purple"
              placeholder="equipo@olffy.cl"
            />
            <p className="text-[11px] text-olffy-ink/40">
              Déjalo vacío para usar el acceso principal existente.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[12px] text-olffy-ink/55">
              Contraseña
            </label>
            <div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-olffy-ink/15 px-4 py-3 text-sm text-olffy-ink outline-none transition focus:border-olffy-purple"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-olffy-purple px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar al panel"}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-[11px] text-olffy-ink/35">
          Acceso privado · OLFFY Admin
        </p>
      </div>
    </div>
  );
}
