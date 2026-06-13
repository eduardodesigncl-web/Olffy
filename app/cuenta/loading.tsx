export default function AccountLoading() {
  return (
    <div className="px-5 py-12">
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-40 rounded-[8px] bg-olffy-purple/20" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-[8px] bg-white/80" />
          <div className="h-28 rounded-[8px] bg-white/80" />
          <div className="h-28 rounded-[8px] bg-white/80" />
        </div>
        <div className="h-64 rounded-[8px] bg-white/80" />
      </div>
    </div>
  );
}
