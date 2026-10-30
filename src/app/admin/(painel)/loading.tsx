export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      <div className="h-8 w-48 animate-pulse rounded-full bg-ink/8" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-ink/5" />
        ))}
      </div>
      <div className="mt-4 h-64 animate-pulse rounded-[var(--radius-card)] bg-ink/5" />
    </div>
  );
}
