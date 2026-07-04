// @ts-nocheck
// SectionHeading — eyebrow + title pattern used throughout the app

const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  fontSize?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  fontSize,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center" : "";
  return (
    <div className={`flex flex-col gap-0 ${alignClass}`}>
      {eyebrow && (
        <span
          className="text-[13px] tracking-[0.18em] uppercase text-black/40 mb-1"
          style={{ fontFamily: T.poppins }}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className="text-black/85 leading-tight"
        style={{
          fontFamily: T.piepie,
          fontSize: fontSize ?? "clamp(36px, 4vw, 56px)",
        }}
      >
        {title}
      </h2>
    </div>
  );
}
