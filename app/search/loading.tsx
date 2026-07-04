export default function Loading() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-[clamp(36px,4.5vw,56px)] lg:px-12">
      <div className="mb-8 h-8 w-56 rounded bg-olffy-ink/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-[280px] animate-pulse rounded-[14px] bg-olffy-ink/5"
          />
        ))}
      </div>
    </section>
  );
}
