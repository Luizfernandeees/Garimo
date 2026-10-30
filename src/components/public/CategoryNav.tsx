import Link from "next/link";
import type { Category } from "@/lib/catalog";

export function CategoryNav({ categories, active }: { categories: Category[]; active?: string }) {
  if (!categories.length) return null;
  const item = (isActive: boolean) =>
    `inline-block shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-ink text-white" : "bg-cream text-ink hover:bg-cream-deep"
    }`;
  return (
    <nav aria-label="Categorias" className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        <li>
          <Link href="/" className={item(active === "__home")} aria-current={active === "__home" ? "page" : undefined}>
            Todos os achados
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categoria/${c.slug}`}
              className={item(active === c.slug)}
              aria-current={active === c.slug ? "page" : undefined}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
