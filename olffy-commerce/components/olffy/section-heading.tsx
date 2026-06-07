export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-olffy-purple">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-brand text-4xl font-black leading-none text-olffy-ink md:text-6xl">
        {title}
      </h2>
      {copy ? (
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-olffy-muted md:text-lg">
          {copy}
        </p>
      ) : null}
    </div>
  );
}
