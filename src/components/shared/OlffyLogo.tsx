// @ts-nocheck
// OlffyLogo — inline SVG logo (orange variant for light backgrounds)
// For the yellow variant used on dark/purple backgrounds, pass variant="yellow"

const C = { orange: "#e94300", yellow: "#fab405" };

interface OlffyLogoProps {
  variant?: "orange" | "yellow" | "white";
  className?: string;
}

// SVG paths extracted from App.tsx svgPaths import
// In production these come from ../imports/WebHome/svg-nc9oybvrkk
// Placeholder paths below — replace with actual SVG data from Figma export
export function OlffyLogo({
  variant = "orange",
  className = "h-[27px] w-[139px]",
}: OlffyLogoProps) {
  const color =
    variant === "yellow"
      ? C.yellow
      : variant === "white"
        ? "#ffffff"
        : C.orange;
  return (
    <svg
      className={className}
      viewBox="0 0 139 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OLFFY"
    >
      {/* Placeholder: replace with actual SVG paths from Figma export */}
      <text
        x="0"
        y="22"
        style={{
          fontFamily: "'PiepieW01-Regular', sans-serif",
          fontSize: 24,
          fill: color,
        }}
      >
        OLFFY
      </text>
    </svg>
  );
}
