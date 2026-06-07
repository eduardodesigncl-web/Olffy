import { Navbar } from "components/layout/navbar";
import { GeistSans } from "geist/font/sans";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Olffy",
    template: "%s | Olffy",
  },
  description:
    "Papeleria chilena creativa: agendas, libretas, stickers y regalos hechos con amor.",
  robots: {
    follow: true,
    index: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" className={GeistSans.variable}>
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
