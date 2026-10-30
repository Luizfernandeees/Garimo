import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/guard";
import { CategoryForm, ConfirmDelete } from "./CategoryForm";
import { deleteCategory, saveCategory } from "./actions";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories, error }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.rpc("admin_category_counts"),
  ]);
  const countOf = (id: string) => counts?.find((c) => c.category_id === id);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Categorias</h1>
      <p className="mt-1 text-sm text-ink/60">Aparecem no menu do site na ordem definida aqui (menor número primeiro).</p>

      <section aria-labelledby="nova" className="mt-8 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
        <h2 id="nova" className="mb-4 font-display text-lg font-semibold">
          Nova categoria
        </h2>
        <CategoryForm action={saveCategory.bind(null, null)} submitLabel="Criar categoria" idPrefix="nova" />
      </section>

      {error ? (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível carregar as categorias.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {(categories ?? []).map((c) => {
            const n = countOf(c.id);
            const total = Number(n?.total ?? 0);
            return (
              <li key={c.id} className="rounded-[var(--radius-card)] border border-ink/8 bg-white">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block font-medium">{c.name}</span>
                      <span className="text-sm text-ink/55">
                        /categoria/{c.slug} · {total} {total === 1 ? "produto" : "produtos"}
                        {total ? `, ${Number(n?.published ?? 0)} publicados` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-ink/15 px-3 py-1 text-sm font-semibold group-open:bg-ink group-open:text-white">
                      Editar
                    </span>
                  </summary>
                  <div className="border-t border-ink/8 p-4 sm:px-6">
                    <CategoryForm
                      action={saveCategory.bind(null, c.id)}
                      initial={{ name: c.name, description: c.description, sort_order: c.sort_order }}
                      submitLabel="Salvar categoria"
                      idPrefix={`cat-${c.id}`}
                    />
                    <div className="mt-4 border-t border-ink/8 pt-4">
                      {total ? (
                        <p className="text-sm text-ink/55">
                          Para excluir, primeiro mude a categoria dos {total} {total === 1 ? "produto" : "produtos"} dela.
                        </p>
                      ) : (
                        <ConfirmDelete action={deleteCategory} id={c.id} name={c.name} />
                      )}
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
