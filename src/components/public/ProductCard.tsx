import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-white transition-colors hover:border-ink/20">
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt=""
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
          priority={priority}
        />
        {product.discount_percent !== null ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-leaf px-2 py-0.5 text-xs font-semibold text-white">
            −{product.discount_percent}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {product.category ? <p className="text-xs text-ink/60">{product.category.name}</p> : null}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug sm:text-[15px]">
          {/* Link "esticado": o cartão inteiro é clicável, sem links aninhados. */}
          <Link href={`/produto/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto pt-1">
          <Price current={product.current_price} previous={product.previous_price} discount={product.discount_percent} />
        </div>
        <span
          aria-hidden
          className="mt-1 inline-flex justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand group-hover:text-ink"
        >
          Ver oferta
        </span>
      </div>
      {/* Anel de foco visível para o cartão inteiro */}
      <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-brand ring-offset-2 group-has-[a:focus-visible]:ring-3" />
    </article>
  );
}
