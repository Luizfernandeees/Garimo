import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full h-full">
            <ProductCard product={p} priority={i < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
