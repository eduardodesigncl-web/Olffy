"use client";

import { useFormStatus } from "react-dom";

export function RedeemButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={disabled || pending}
      className="mt-5 w-full rounded-[6px] bg-olffy-purple px-4 py-3 font-brand text-sm font-black text-white transition hover:bg-olffy-ink disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {pending ? "Solicitando..." : "Solicitar canje"}
    </button>
  );
}
