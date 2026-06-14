import { Navbar } from "components/layout/navbar";
import { GeistSans } from "geist/font/sans";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OLFFY",
  url: baseUrl,
  description:
    "Papelería chilena creativa: agendas, libretas, stickers y regalos desde Viña del Mar.",
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
    <html lang="es" className={GeistSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className="selection:bg-olffy-yellow selection:text-olffy-ink">
        <Navbar />
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
