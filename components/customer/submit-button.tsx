"use client";

import { useFormStatus } from "react-dom";

export function RedeemButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={disabled || pending}
      className="mt-5 w-full rounded-full bg-olffy-orange px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Solicitando..." : "Solicitar canje"}
    </button>
  );
}
