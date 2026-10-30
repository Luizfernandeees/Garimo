export default function Loading() {
  return (
    <div className="container-page pt-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando produtos…</span>
      <div className="h-8 w-56 animate-pulse rounded-full bg-cream" />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-ink/8">
            <div className="aspect-square animate-pulse bg-cream" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-cream" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-cream" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-cream" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
