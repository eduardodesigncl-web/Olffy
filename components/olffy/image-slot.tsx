export function ImageSlot({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`grid place-items-center border border-dashed border-olffy-ink/20 bg-[#f4f4f4] text-center text-olffy-ink/65 ${className}`}
    >
      <div>
        <div className="mx-auto mb-2 grid h-6 w-6 place-items-center rounded border border-olffy-ink/20 text-xs">
          ▧
        </div>
        <div className="text-sm">{label}</div>
        <div className="mt-1 text-[11px] underline">or browse files</div>
      </div>
    </div>
  );
}
