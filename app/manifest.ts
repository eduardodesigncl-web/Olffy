import type { MetadataRoute } from "next";

// Web App Manifest (Next.js lo sirve en /manifest.webmanifest y enlaza el
// <link rel="manifest"> automáticamente). Aporta iconos maskable para Android,
// nombre e identidad de marca para instalación/PWA y buscadores.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OLFFY | Papelería chilena creativa",
    short_name: "OLFFY",
    description:
      "Papelería chilena con diseño: agendas, libretas ilustradas, stickers y regalos desde Viña del Mar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5857B6",
    lang: "es-CL",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
