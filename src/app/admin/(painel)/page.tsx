import type { Metadata } from "next";
import Link from "next/link";
import { ClicksChart } from "@/components/admin/ClicksChart";
import { requireAdmin } from "@/lib/supabase/guard";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { ProductStatus } from "@/types/database";

export const metadata: Metadata = { title: "Visão geral" };

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();

  const countProducts = (status?: ProductStatus) => {
    const q = supabase.from("products").select("id", { count: "exact", head: true });
    return status ? q.eq("status", status) : q;
  };

  // Todos os números vêm do banco. Nada de vendas ou comissões: esses
  // dados só existirão com integração autorizada da Shopee.
  const [total, published, drafts, archived, clicks, byDay, top, latest] = await Promise.all([
    countProducts(),
    countProducts("published"),
    countProducts("draft"),
    countProducts("archived"),
    supabase.from("clicks").select("id", { count: "exact", head: true }),
    supabase.rpc("clicks_by_day", { p_days: 14 }),
    supabase.rpc("top_clicked_products", { p_days: 30, p_limit: 5 }),
    supabase
      .from("products")
      .select("id, name, slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [total, published, drafts, archived, clicks, byDay, top, latest].some((r) => r.error);

  const stats = [
    { label: "Produtos cadastrados", value: total.count ?? 0 },
    { label: "Publicados", value: published.count ?? 0 },
    { label: "Rascunhos", value: drafts.count ?? 0 },
    { label: "Arquivados", value: archived.count ?? 0 },
  ];
  const days = byDay.data ?? [];
  const clicks14 = days.reduce((s, d) => s + Number(d.clicks), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Visão geral</h1>
          <p className="mt-1 text-sm text-ink/60">Números em tempo real, direto do banco de dados.</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-hover"
        >
          Cadastrar produto
        </Link>
      </div>

      {failed ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Parte dos dados não carregou. Recarregue a página; se continuar, confira se as migrations foram aplicadas no
          Supabase.
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-card)] border border-ink/8 bg-white p-4 sm:p-5">
            <dt className="text-sm text-ink/60">{s.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold tracking-tight">{formatNumber(s.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="cliques" className="rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="cliques" className="font-display text-lg font-semibold">
              Cliques em “Ver oferta”
            </h2>
            <p className="text-sm text-ink/60">
              <span className="font-semibold text-ink">{formatNumber(clicks.count ?? 0)}</span> no total
            </p>
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {formatNumber(clicks14)} nos últimos 14 dias. Robôs e pré-carregamentos não são contados.
          </p>
          <div className="mt-8">
            <ClicksChart days={days} />
          </div>
        </section>

        <section aria-labelledby="mais-acessados" className="rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <h2 id="mais-acessados" className="font-display text-lg font-semibold">
            Mais acessados
          </h2>
          <p className="mt-1 text-sm text-ink/60">Últimos 30 dias</p>
          {top.data?.length ? (
            <ol className="mt-4 divide-y divide-ink/8">
              {top.data.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    {p.status !== "published" ? (
                      <span className="text-xs text-ink/50">{STATUS_LABEL[p.status]}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink/70">
                    {formatNumber(Number(p.clicks))} {Number(p.clicks) === 1 ? "clique" : "cliques"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 text-sm text-ink/60">Os produtos mais clicados aparecem aqui depois dos primeiros acessos.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="ultimas" className="mt-4 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <h2 id="ultimas" className="font-display text-lg font-semibold">
          Últimas publicações
        </h2>
        {latest.data?.length ? (
          <ul className="mt-3 divide-y divide-ink/8">
            {latest.data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <Link href={`/admin/produtos/${p.id}`} className="min-w-0 truncate font-medium hover:underline">
                  {p.name}
                </Link>
                <span className="shrink-0 text-ink/60">{formatDateTime(p.published_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/60">
            Nenhum produto publicado ainda.{" "}
            <Link href="/admin/produtos/novo" className="font-semibold text-brand-deep underline">
              Cadastre o primeiro
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
