// @ts-nocheck
// ImgBox — placeholder image tile used throughout the app
// Replace with real <img> or <Image> when connecting to Shopify/CDN

interface ImgBoxProps {
  className?: string;
  rounded?: string;
  tint?: string;
}

export function ImgBox({
  className = "",
  rounded = "rounded-xl",
  tint,
}: ImgBoxProps) {
  return (
    <div
      className={`border-2 border-black/10 relative overflow-hidden flex items-center justify-center ${rounded} ${className}`}
      style={{ background: tint ?? "#eee" }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        className="opacity-20"
      >
        <rect
          x="4"
          y="8"
          width="40"
          height="32"
          rx="3"
          stroke="black"
          strokeWidth="2"
        />
        <circle cx="17" cy="20" r="4" stroke="black" strokeWidth="2" />
        <path
          d="M4 34l10-10 8 8 6-6 16 10"
          stroke="black"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
