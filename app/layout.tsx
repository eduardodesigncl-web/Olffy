import { GeistSans } from "geist/font/sans";
import { Poppins } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "src/styles/olffy-tokens.css";
import "./globals.css";
import "src/olffy/styles/global.css";
import { baseUrl } from "lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { INSTAGRAM_PROFILE_URL } from "src/olffy/config/social";

// Poppins self-hosteada por Next (sin request bloqueante a Google Fonts).
// Expone la variable CSS --font-poppins-src que usan los tokens de marca.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins-src",
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OLFFY",
  url: baseUrl,
  description:
    "Papelería chilena creativa: agendas, libretas, stickers y regalos desde Viña del Mar.",
  sameAs: [INSTAGRAM_PROFILE_URL],
  address: {
    "@type": "PostalAddress",
    streetAddress: "2 Oriente 1145, Local 3",
    addressLocality: "Viña del Mar",
    addressRegion: "Valparaíso",
    addressCountry: "CL",
  },
};

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "OLFFY | Papelería chilena creativa desde Viña del Mar",
    template: "%s | OLFFY",
  },
  description:
    "Descubre papelería chilena con diseño: agendas, libretas ilustradas, stickers y regalos hechos con amor desde Viña del Mar.",
  robots: {
    follow: true,
    index: true,
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: baseUrl,
    siteName: "OLFFY",
    title: "OLFFY | Papelería chilena creativa desde Viña del Mar",
    description:
      "Descubre papelería chilena con diseño: agendas, libretas ilustradas, stickers y regalos hechos con amor desde Viña del Mar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OLFFY | Papelería chilena creativa",
    description:
      "Agendas, libretas ilustradas, stickers y regalos desde Viña del Mar.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${poppins.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Preload de la fuente del título del hero (elemento LCP). */}
        <link
          rel="preload"
          href="/olffy/fonts/Piepie-W01-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className="selection:bg-olffy-yellow selection:text-olffy-ink">
        <main>
          {children}
          <Toaster closeButton />
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
