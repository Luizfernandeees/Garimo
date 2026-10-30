import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/public/EmptyState";
import { Pagination } from "@/components/public/Pagination";
import { ProductGrid } from "@/components/public/ProductGrid";
import { getCategories, searchProducts } from "@/lib/catalog";
import { formatNumber, pageParam, sanitizeSearch } from "@/lib/format";

type Props = { searchParams: Promise<{ q?: string; categoria?: string; pagina?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const term = sanitizeSearch(q);
  return {
    title: term ? `Busca: ${term}` : "Todos os produtos",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const term = sanitizeSearch(sp.q);
  const categorySlug = sp.categoria && /^[a-z0-9-]{1,60}$/.test(sp.categoria) ? sp.categoria : undefined;
  const page = pageParam(sp.pagina);

  const [categories, { items, total }] = await Promise.all([
    getCategories(),
    searchProducts({ q: term, categorySlug, page }),
  ]);
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const heading = term ? `Resultados para “${term}”` : activeCategory ? activeCategory.name : "Todos os produtos";

  return (
    <div className="container-page pt-6 sm:pt-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">{heading}</h1>
        <p className="mt-2 text-sm text-ink/60" aria-live="polite">
          {total ? `${formatNumber(total)} ${total === 1 ? "produto encontrado" : "produtos encontrados"}` : null}
        </p>
      </header>

      {/* Filtros: formulário GET, funciona sem JavaScript */}
      <form action="/busca" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 sm:max-w-md">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
            Nome ou palavra-chave
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={term}
            maxLength={80}
            placeholder="Ex.: fone, organizador, luminária"
            className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-[15px] placeholder:text-ink/45 focus:border-ink/40 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="categoria" className="mb-1.5 block text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categorySlug ?? ""}
            className="w-full appearance-none rounded-full border border-ink/15 bg-white px-4 py-2.5 pr-10 text-[15px] focus:border-ink/40 focus:outline-none sm:w-56"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23292929' stroke-width='2'%3E%3Cpath d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.9rem center",
              backgroundSize: "1rem",
            }}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-ink/85"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-8">
        {items.length ? (
          <>
            <ProductGrid products={items} priorityCount={2} />
            <Pagination
              page={page}
              total={total}
              basePath="/busca"
              params={{ q: term || undefined, categoria: categorySlug }}
            />
          </>
        ) : term ? (
          <EmptyState title={`Nenhum produto encontrado para “${term}”`}>
            <p>Tente uma palavra mais curta ou diferente, ou navegue pelas categorias.</p>
            <CategoryLinks categories={categories} />
          </EmptyState>
        ) : (
          <EmptyState title={activeCategory ? `Ainda não há achados em ${activeCategory.name}` : "Ainda não há produtos publicados"}>
            <p>Os produtos aparecem aqui assim que forem publicados.</p>
          </EmptyState>
        )}
      </div>
    </div>
  );
}

function CategoryLinks({ categories }: { categories: { id: string; slug: string; name: string }[] }) {
  if (!categories.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-2">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/categoria/${c.slug}`} className="inline-block rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-cream-deep">
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
