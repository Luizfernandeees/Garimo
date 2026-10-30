import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/supabase/guard";
import { formatDateTime, formatNumber, formatPrice, pageParam, sanitizeSearch } from "@/lib/format";
import type { ProductStatus } from "@/types/database";

export const metadata: Metadata = { title: "Produtos" };

const PAGE = 25;
const TABS: { key: "" | ProductStatus; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "published", label: STATUS_LABEL.published },
  { key: "draft", label: STATUS_LABEL.draft },
  { key: "archived", label: STATUS_LABEL.archived },
];

type Props = { searchParams: Promise<{ status?: string; q?: string; pagina?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status = (["draft", "published", "archived"].includes(sp.status ?? "") ? sp.status : "") as "" | ProductStatus;
  const q = sanitizeSearch(sp.q);
  const page = pageParam(sp.pagina);

  const count = (s?: ProductStatus) => {
    const query = supabase.from("products").select("id", { count: "exact", head: true });
    return s ? query.eq("status", s) : query;
  };

  let list = supabase
    .from("products")
    .select("id, name, slug, status, current_price, image_url, updated_at, category:categories(name)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (status) list = list.eq("status", status);
  if (q) list = list.ilike("name", `%${q}%`);

  const [all, published, draft, archived, result] = await Promise.all([
    count(),
    count("published"),
    count("draft"),
    count("archived"),
    list,
  ]);
  const counts: Record<string, number> = {
    "": all.count ?? 0,
    published: published.count ?? 0,
    draft: draft.count ?? 0,
    archived: archived.count ?? 0,
  };
  const items = result.data ?? [];
  const total = result.count ?? 0;
  const pages = Math.ceil(total / PAGE);

  const href = (params: { status?: string; q?: string; pagina?: number }) => {
    const s = new URLSearchParams();
    if (params.status) s.set("status", params.status);
    if (params.q) s.set("q", params.q);
    if (params.pagina && params.pagina > 1) s.set("pagina", String(params.pagina));
    const qs = s.toString();
    return qs ? `/admin/produtos?${qs}` : "/admin/produtos";
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-ink/60">Rascunhos ficam só aqui. Publicados aparecem no site na hora.</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-hover"
        >
          <Plus className="size-4" aria-hidden /> Cadastrar produto
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filtrar por status" className="no-scrollbar -mx-1 overflow-x-auto px-1">
          <ul className="flex gap-1">
            {TABS.map((t) => (
              <li key={t.key} className="shrink-0">
                <Link
                  href={href({ status: t.key, q })}
                  aria-current={status === t.key ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                    status === t.key ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5"
                  }`}
                >
                  {t.label}
                  <span className={`tabular-nums ${status === t.key ? "text-white/70" : "text-ink/45"}`}>{counts[t.key]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action="/admin/produtos" method="get" role="search" className="flex items-center gap-2 rounded-full border border-ink/15 bg-white py-1 pl-3 pr-1 sm:w-72">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Search className="size-4 text-ink/45" aria-hidden />
          <label htmlFor="busca-produtos" className="sr-only">
            Buscar produto pelo nome
          </label>
          <input
            id="busca-produtos"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar pelo nome"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm focus:outline-none"
          />
          <button type="submit" className="rounded-full bg-ink/8 px-3 py-1.5 text-sm font-semibold hover:bg-ink/12">
            Buscar
          </button>
        </form>
      </div>

      {result.error ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível carregar os produtos. Recarregue a página.
        </p>
      ) : items.length ? (
        <ul className="mt-5 divide-y divide-ink/8 overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-white">
          {items.map((p) => (
            <li key={p.id} className="relative flex items-center gap-3 p-3 hover:bg-ink/[0.02] sm:gap-4 sm:px-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-cream sm:size-16">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="size-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/produtos/${p.id}`} className="line-clamp-2 text-sm font-medium after:absolute after:inset-0 sm:line-clamp-1 sm:text-[15px]">
                  {p.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/55">
                  <StatusBadge status={p.status} />
                  <span>{p.category?.name ?? "Sem categoria"}</span>
                  <span className="hidden sm:inline">Atualizado {formatDateTime(p.updated_at)}</span>
                </p>
              </div>
              <span className="shrink-0 text-right font-display text-sm font-semibold tabular-nums sm:text-base">
                {formatPrice(p.current_price) ?? <span className="font-sans text-xs font-normal text-ink/45">Sem preço</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-[var(--radius-card)] border border-dashed border-ink/15 bg-white px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold">
            {q ? `Nenhum produto com “${q}”` : counts[""] ? "Nenhum produto neste filtro" : "Nenhum produto cadastrado ainda"}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {counts[""] ? "Tente outro filtro ou outra palavra." : "Cadastre o primeiro achado com o link de afiliado da Shopee."}
          </p>
          {!counts[""] ? (
            <Link href="/admin/produtos/novo" className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand-hover">
              Cadastrar produto
            </Link>
          ) : null}
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={href({ status, q, pagina: page - 1 })} className="rounded-full border border-ink/15 px-4 py-2 font-semibold hover:border-ink/40">
              Anterior
            </Link>
          ) : null}
          <span className="text-ink/60">
            Página {page} de {pages} · {formatNumber(total)} produtos
          </span>
          {page < pages ? (
            <Link href={href({ status, q, pagina: page + 1 })} className="rounded-full border border-ink/15 px-4 py-2 font-semibold hover:border-ink/40">
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
