export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-7 w-56 rounded-lg bg-slate-200" />
      <div className="mb-4 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="mb-3 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-16 rounded-full bg-slate-200" />
        ))}
      </div>
      <div className="h-[70vh] w-full rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
    </div>
  );
}
