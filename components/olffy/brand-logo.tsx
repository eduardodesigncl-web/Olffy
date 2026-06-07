import Link from "next/link";

export function OlffyMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="8"
        y="8"
        width="28"
        height="28"
        rx="10"
        stroke="currentColor"
        strokeWidth="4"
        transform="rotate(45 22 22)"
      />
      <path
        d="M13 22c4.5-8 13.5-8 18 0-4.5 8-13.5 8-18 0Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 13c8 4.5 8 13.5 0 18-8-4.5-8-13.5 0-18Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OlffyLogo({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-olffy-ink"
      aria-label="Ir al inicio de Olffy"
    >
      <OlffyMark className={compact ? "h-7 w-7" : "h-9 w-9"} />
      <span
        className={
          compact
            ? "font-brand text-xl font-black tracking-wide"
            : "font-brand text-2xl font-black tracking-wide"
        }
      >
        OLFFY
      </span>
    </Link>
  );
}
