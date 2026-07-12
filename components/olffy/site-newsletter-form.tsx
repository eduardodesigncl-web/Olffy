"use client";

import { useState, type FormEvent } from "react";
import { subscribeNewsletterAction } from "src/olffy/integration/marketing-actions";

export function SiteNewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await subscribeNewsletterAction(email);
      if (!result.success) {
        throw new Error(result.error || "No se pudo completar la suscripción");
      }
      setEmail("");
      setMessage(
        result.pending
          ? "Solicitud recibida. La sincronización está en curso."
          : "Revisa tu correo para confirmar la suscripción.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar la suscripción",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 md:block"
      onSubmit={(event) => void submit(event)}
    >
      <label className="sr-only" htmlFor="footer-email">
        Correo electrónico
      </label>
      <input
        id="footer-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Correo electrónico"
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35 md:text-[14px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-olffy-orange px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60 md:mt-3"
      >
        {loading ? "Enviando..." : "Suscribirse"}
      </button>
      {message ? (
        <p className="mt-2 text-xs text-[#fff5d9]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-[#ffd6cc]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
