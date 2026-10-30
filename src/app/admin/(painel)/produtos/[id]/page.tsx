import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, ExternalLink, FilePen, Send } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ShareComposer } from "@/components/admin/ShareComposer";
import { env } from "@/lib/env";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/supabase/guard";
import { formatDateTime, formatPrice } from "@/lib/format";
import { priceToInput } from "@/lib/price";
import type { Json, ProductStatus } from "@/types/database";
import { changeStatus, saveProduct } from "../actions";

export const metadata: Metadata = { title: "Editar produto" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> };

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  criado: { tone: "ok", text: "Produto salvo como rascunho. Ele ainda não aparece no site." },
  publicado: { tone: "ok", text: "Produto publicado. Ele já aparece no site." },
  arquivado: { tone: "ok", text: "Produto arquivado. Ele saiu do site, mas continua guardado aqui." },
  rascunho: { tone: "ok", text: "Produto movido para rascunho. Ele saiu do site." },
  incompleto: { tone: "warn", text: "Para publicar, o produto precisa de preço atual, categoria e pelo menos uma imagem." },
  erro: { tone: "warn", text: "Não foi possível alterar o status. Tente de novo." },
};

const FIELD_LABEL: Record<string, string> = {
  name: "nome",
  slug: "endereço",
  description: "descrição",
  current_price: "preço atual",
  previous_price: "preço anterior",
  previous_price_confirmed: "confirmação do preço anterior",
  image_url: "imagem principal",
  affiliate_url: "link de afiliado",
  category_id: "categoria",
  status: "status",
  is_featured: "destaque",
};

const ACTION_LABEL: Record<string, string> = {
  created: "Cadastrado",
  updated: "Editado",
  "status:published": "Publicado",
  "status:archived": "Arquivado",
  "status:draft": "Movido para rascunho",
};

function describeChanges(action: string, changes: Json) {
  if (action === "created" || typeof changes !== "object" || changes === null || Array.isArray(changes)) return null;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(changes)) {
    if (key === "status" || !FIELD_LABEL[key]) continue;
    const change = value as { de?: unknown; para?: unknown } | null;
    if ((key === "current_price" || key === "previous_price") && change) {
      const from = change.de == null ? "vazio" : formatPrice(Number(change.de));
      const to = change.para == null ? "vazio" : formatPrice(Number(change.para));
      parts.push(`${FIELD_LABEL[key]}: ${from} → ${to}`);
    } else {
      parts.push(FIELD_LABEL[key]);
    }
  }
  return parts.length ? parts.join(", ") : null;
}

function StatusButton({ id, to, children, variant }: { id: string; to: ProductStatus; children: React.ReactNode; variant: "primary" | "dark" | "ghost" }) {
  return (
    <form action={changeStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton variant={variant} pendingLabel="Alterando…" className={variant === "ghost" ? "border border-ink/15" : ""}>
        {children}
      </SubmitButton>
    </form>
  );
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, { aviso }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: categories }, { data: history }, { count: clicks }] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(url, sort_order)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "images" })
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug").order("sort_order").order("name"),
    supabase.from("product_history").select("id, action, changes, created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(15),
    supabase.from("clicks").select("id", { count: "exact", head: true }).eq("product_id", id),
  ]);
  if (!product) notFound();

  const notice = aviso ? NOTICES[aviso] : undefined;
  const images = product.images.length ? product.images.map((i) => ({ url: i.url })) : product.image_url ? [{ url: product.image_url }] : [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Produtos
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">{product.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
            <StatusBadge status={product.status} />
            {product.published_at && product.status === "published" ? <span>Publicado em {formatDateTime(product.published_at)}</span> : null}
            <span>
              {clicks ?? 0} {clicks === 1 ? "clique" : "cliques"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.status === "published" ? (
            <>
              <a
                href={`/produto/${product.slug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold hover:border-ink/40"
              >
                <ExternalLink className="size-4" aria-hidden /> Ver no site
              </a>
              <StatusButton id={product.id} to="draft" variant="ghost">
                <FilePen className="size-4" aria-hidden /> Mover para rascunho
              </StatusButton>
              <StatusButton id={product.id} to="archived" variant="dark">
                <Archive className="size-4" aria-hidden /> Arquivar
              </StatusButton>
            </>
          ) : product.status === "draft" ? (
            <>
              <StatusButton id={product.id} to="archived" variant="ghost">
                <Archive className="size-4" aria-hidden /> Arquivar
              </StatusButton>
              <StatusButton id={product.id} to="published" variant="primary">
                <Send className="size-4" aria-hidden /> Publicar
              </StatusButton>
            </>
          ) : (
            <>
              <StatusButton id={product.id} to="draft" variant="ghost">
                <FilePen className="size-4" aria-hidden /> Mover para rascunho
              </StatusButton>
              <StatusButton id={product.id} to="published" variant="primary">
                <Send className="size-4" aria-hidden /> Republicar
              </StatusButton>
            </>
          )}
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className={`mt-5 rounded-xl px-4 py-3 text-sm ${notice.tone === "ok" ? "bg-leaf/10 text-leaf" : "bg-amber-50 text-amber-900"}`}
        >
          {notice.text}
        </p>
      ) : null}

      <section aria-labelledby="divulgar" className="mt-8 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <h2 id="divulgar" className="font-display text-lg font-semibold">
          Divulgar
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Posts prontos com os dados salvos deste produto. Salve as alterações do formulário antes de gerar o post.
        </p>
        <ShareComposer
          published={product.status === "published"}
          siteUrl={env.siteUrl}
          product={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            current_price: product.current_price,
            previous_price: product.previous_price,
            discount_percent: product.discount_percent,
            category: categories?.find((c) => c.id === product.category_id)?.name ?? null,
            affiliate_url: product.affiliate_url,
          }}
        />
      </section>

      <div className="mt-8">
        <ProductForm
          action={saveProduct.bind(null, product.id)}
          productId={product.id}
          categories={categories ?? []}
          status={product.status}
          initial={{
            affiliate_url: product.affiliate_url,
            name: product.name,
            description: product.description ?? "",
            current_price: priceToInput(product.current_price),
            previous_price: priceToInput(product.previous_price),
            previous_price_confirmed: product.previous_price_confirmed,
            category_id: product.category_id ?? "",
            is_featured: product.is_featured,
            images,
          }}
        />
      </div>

      <section aria-labelledby="historico" className="mt-10 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <h2 id="historico" className="font-display text-lg font-semibold">
          Histórico
        </h2>
        {history?.length ? (
          <ol className="mt-3 divide-y divide-ink/8">
            {history.map((h) => {
              const detail = describeChanges(h.action, h.changes);
              return (
                <li key={h.id} className="flex flex-col gap-0.5 py-2.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span>
                    <span className="font-medium">{ACTION_LABEL[h.action] ?? "Alterado"}</span>
                    {detail ? <span className="text-ink/60">: {detail}</span> : null}
                  </span>
                  <span className="shrink-0 text-ink/50">{formatDateTime(h.created_at)}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-ink/60">Sem alterações registradas.</p>
        )}
      </section>
    </div>
  );
}
