"use client";

import { useEffect } from "react";

export function AdminChromeGuard() {
  useEffect(() => {
    const header = document.body.querySelector(
      ":scope > header",
    ) as HTMLElement | null;
    const previousDisplay = header?.style.display;

    document.body.classList.add("olffy-admin-route");
    if (header) {
      header.style.display = "none";
    }

    return () => {
      document.body.classList.remove("olffy-admin-route");
      if (header) {
        header.style.display = previousDisplay ?? "";
      }
    };
  }, []);

  return null;
}
