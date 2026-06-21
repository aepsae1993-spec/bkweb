export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-7 w-52 rounded-lg bg-slate-200" />
      <div className="mb-6 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
        ))}
      </div>
    </div>
  );
}
