import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/public/CategoryNav";
import { EmptyState } from "@/components/public/EmptyState";
import { Pagination } from "@/components/public/Pagination";
import { ProductGrid } from "@/components/public/ProductGrid";
import { getCategories, getCategoryBySlug, getCategoryProducts } from "@/lib/catalog";
import { formatNumber, pageParam } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pagina?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoria não encontrada" };
  return {
    title: category.name,
    description: category.description ?? `Achados de ${category.name} selecionados pela GARIMO na Shopee.`,
    alternates: { canonical: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = pageParam(sp.pagina);
  const [category, categories] = await Promise.all([getCategoryBySlug(slug), getCategories()]);
  if (!category) notFound();

  const { items, total } = await getCategoryProducts(category.id, page);

  return (
    <div className="container-page pt-6 sm:pt-8">
      <CategoryNav categories={categories} active={category.slug} />

      <header className="mt-8 max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">{category.name}</h1>
        {category.description ? <p className="mt-3 text-ink/70 sm:text-lg">{category.description}</p> : null}
        {total ? (
          <p className="mt-3 text-sm text-ink/60">
            {formatNumber(total)} {total === 1 ? "produto" : "produtos"}
          </p>
        ) : null}
      </header>

      <div className="mt-8">
        {items.length ? (
          <>
            <ProductGrid products={items} priorityCount={2} />
            <Pagination page={page} total={total} basePath={`/categoria/${category.slug}`} />
          </>
        ) : page > 1 ? (
          <EmptyState title="Esta página não existe">
            <p>
              <Link href={`/categoria/${category.slug}`} className="font-semibold text-brand-deep underline">
                Voltar para a primeira página
              </Link>
            </p>
          </EmptyState>
        ) : (
          <EmptyState title={`Ainda não há achados em ${category.name}`}>
            <p>
              Assim que um produto desta categoria for publicado, ele aparece aqui.{" "}
              <Link href="/" className="font-semibold text-brand-deep underline">
                Ver todos os achados
              </Link>
            </p>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
