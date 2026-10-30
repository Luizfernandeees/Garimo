import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Info } from "lucide-react";
import { Price } from "@/components/public/Price";
import { ProductGallery } from "@/components/public/ProductGallery";
import { ProductGrid } from "@/components/public/ProductGrid";
import { Section } from "@/components/public/Section";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

// Nenhuma página é gerada no build: cada produto é renderizado no
// primeiro acesso e então fica em cache (ISR) por até 60 s.
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

function summary(text: string | null, fallback: string) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 155 ? `${clean.slice(0, 152).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  const description = summary(product.description, `${product.name}: achado selecionado pela GARIMO na Shopee.`);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/produto/${product.slug}`,
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category?.slug, product.id);
  const images = product.images.length
    ? product.images
    : product.image_url
      ? [{ id: "principal", url: product.image_url, alt: product.name }]
      : [];
  const updated = formatDate(product.updated_at);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: summary(product.description, product.name),
    image: images.map((i) => i.url),
    url: `${env.siteUrl}/produto/${product.slug}`,
    ...(product.current_price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: Number(product.current_price).toFixed(2),
            priceCurrency: "BRL",
            url: `${env.siteUrl}/produto/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="container-page pt-6 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Você está em" className="mb-5 text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link href="/" className="hover:text-ink hover:underline">
              Início
            </Link>
          </li>
          {product.category ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/categoria/${product.category.slug}`} className="hover:text-ink hover:underline">
                  {product.category.name}
                </Link>
              </li>
            </>
          ) : null}
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery name={product.name} images={images} />

        <div className="md:pt-2">
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-6">
            <Price
              size="lg"
              current={product.current_price}
              previous={product.previous_price}
              discount={product.discount_percent}
            />
          </div>

          <a
            href={`/ir/${product.slug}?src=site`}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-base font-semibold text-ink transition-colors hover:bg-brand-hover sm:w-auto sm:px-10"
          >
            Ver oferta na Shopee
            <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only">(abre em nova aba)</span>
          </a>

          <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-ink/10 pt-5 text-sm">
            {product.category ? (
              <>
                <dt className="text-ink/60">Categoria</dt>
                <dd>
                  <Link href={`/categoria/${product.category.slug}`} className="font-medium hover:underline">
                    {product.category.name}
                  </Link>
                </dd>
              </>
            ) : null}
            {updated ? (
              <>
                <dt className="text-ink/60">Atualizado em</dt>
                <dd>
                  <time dateTime={product.updated_at}>{updated}</time>
                </dd>
              </>
            ) : null}
            <dt className="text-ink/60">Vendido em</dt>
            <dd>Shopee</dd>
          </dl>

          <div className="mt-6 flex gap-3 rounded-2xl bg-cream p-4 text-sm leading-relaxed text-ink/80">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-deep" aria-hidden />
            <div className="space-y-1.5">
              <p>
                Preços e disponibilidade podem mudar na Shopee a qualquer momento. Confira o valor final antes de comprar.
              </p>
              <p>
                Este é um link de afiliado: a GARIMO pode receber uma comissão por compras elegíveis, sem custo extra para
                você.
              </p>
            </div>
          </div>
        </div>
      </div>

      {product.description ? (
        <section aria-labelledby="sobre" className="mt-14 max-w-3xl">
          <h2 id="sobre" className="font-display text-xl font-bold tracking-tight">
            Sobre o produto
          </h2>
          <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/80">{product.description}</div>
        </section>
      ) : null}

      {related.length ? (
        <Section
          title={`Mais em ${product.category?.name ?? "achados"}`}
          href={product.category ? `/categoria/${product.category.slug}` : undefined}
          hrefLabel="Ver a categoria"
        >
          <ProductGrid products={related} />
        </Section>
      ) : null}
    </div>
  );
}
