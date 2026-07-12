import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MouseLabsAdminLink } from "./mouselabs-admin-link";
import { SiteNewsletterForm } from "./site-newsletter-form";

type FooterLink = [label: string, href: string];

const storeLinks: FooterLink[] = [
  ["Cuadernos", "/tienda"],
  ["Planners", "/tienda"],
  ["Stickers", "/tienda"],
  ["Calendarios", "/tienda"],
  ["Regalos", "/regalos"],
];

const aboutLinks: FooterLink[] = [
  ["Nuestra historia", "/nuestra-historia"],
  ["Contacto", "/contacto"],
  ["OLFFY Puntos ⭐", "/cuenta"],
  ["Blog", "/novedades"],
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-olffy-purple text-[#fff5d9]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[18%] -left-[2%] select-none whitespace-nowrap font-brand text-[clamp(100px,18vw,240px)] font-black lowercase leading-[0.8] text-white/5"
      >
        olffy
      </div>
      <div className="relative mx-auto max-w-[1240px] px-4 pb-0 pt-[clamp(44px,5.5vw,72px)] lg:px-12">
        <div className="grid gap-10 md:flex md:items-start md:gap-16">
          <div>
            <div className="mb-3.5">
              <Image
                src="/olffy/logo.png"
                alt="OLFFY"
                width={116}
                height={36}
                className="h-[30px] w-auto object-contain"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(72%) sepia(65%) saturate(1400%) hue-rotate(3deg) brightness(1.05)",
                }}
              />
            </div>
            <p className="mb-[18px] max-w-[200px] text-[13px] leading-[1.6] text-[#fff5d9]/70">
              Papelería ilustrada para crear y regalar con magia.
            </p>
            <div className="flex gap-2">
              <SocialLink label="Instagram">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </SocialLink>
              <SocialLink label="Facebook">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1z" />
                </svg>
              </SocialLink>
              <SocialLink label="X">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4 4l11.733 16H20L8.267 4H4z" />
                  <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
                </svg>
              </SocialLink>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:flex md:flex-1 md:gap-16">
            <FooterColumn title="Tienda" links={storeLinks} />
            <FooterColumn title="Nosotros" links={aboutLinks} />
          </div>

          <div className="min-w-[190px] md:w-[340px] md:shrink-0">
            <div className="mb-2.5 font-brand text-[20px] font-bold text-white">
              Suscríbete
            </div>
            <p className="mb-4 font-editorial text-[15px] italic leading-[1.55] text-[#fff5d9]/65">
              Novedades, lanzamientos y ofertas exclusivas.
            </p>
            <SiteNewsletterForm />
          </div>
        </div>

        <div className="mt-[clamp(32px,4vw,48px)] flex flex-wrap items-center justify-between gap-2.5 border-t border-white/10 py-[18px] text-xs text-[#fff5d9]/50">
          <span>
            © 2026 Olffy. <MouseLabsAdminLink />
          </span>
          <span>Organiza, crea y regala con magia.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <div className="mb-3 font-brand text-[15px] font-bold text-white">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-left text-[13px] text-[#fff5d9]/70 transition hover:text-white"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SocialLink({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-white/10 text-white"
    >
      {children}
    </a>
  );
}
