import Link from "next/link";
import { PAGE_SIZE } from "@/lib/catalog";

export function Pagination({
  page,
  total,
  basePath,
  params = {},
}: {
  page: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("pagina", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const btn = "rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-ink/40";
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn} rel="prev">
          Página anterior
        </Link>
      ) : null}
      <span className="text-sm text-ink/60">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={btn} rel="next">
          Próxima página
        </Link>
      ) : null}
    </nav>
  );
}
