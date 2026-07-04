"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MouseLabsAdminLink() {
  const router = useRouter();
  const [clicks, setClicks] = useState(0);

  return (
    <button
      type="button"
      title="Admin x3"
      onClick={() => {
        const nextClicks = clicks + 1;
        setClicks(nextClicks);

        if (nextClicks >= 3) {
          router.push("/admin");
        }
      }}
      className="cursor-pointer border-0 bg-transparent p-0 text-inherit opacity-70 transition hover:opacity-100"
    >
      Hecho por Mouselabs
    </button>
  );
}
