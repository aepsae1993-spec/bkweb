export default function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-7 w-56 max-w-full rounded-lg bg-slate-200" />
      <div className="mb-6 h-4 w-72 max-w-full rounded bg-slate-200" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 ring-1 ring-slate-200" />
        ))}
      </div>
    </div>
  );
}
