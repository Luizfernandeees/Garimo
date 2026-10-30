"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/guard";
import { slugify } from "@/lib/slug";

export type CategoryState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "description" | "sort_order", string>>;
};

const schema = z.object({
  name: z.string().trim().min(2, "Use pelo menos 2 caracteres.").max(60, "Use no máximo 60 caracteres."),
  description: z.string().trim().max(300, "Use no máximo 300 caracteres.").optional().default(""),
  sort_order: z.coerce.number().int("Use um número inteiro.").min(0).max(999).optional().default(0),
});

function errorsOf(error: z.ZodError) {
  const out: CategoryState["fieldErrors"] = {};
  for (const i of error.issues) out[i.path[0] as "name"] ??= i.message;
  return out;
}

export async function saveCategory(categoryId: string | null, _prev: CategoryState, formData: FormData): Promise<CategoryState> {
  const { supabase } = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revise os campos.", fieldErrors: errorsOf(parsed.error) };
  const { name, description, sort_order } = parsed.data;

  const { data: sameName } = await supabase.from("categories").select("id").ilike("name", name).limit(1);
  if (sameName?.some((c) => c.id !== categoryId)) {
    return { status: "error", message: "Revise os campos.", fieldErrors: { name: "Já existe uma categoria com este nome." } };
  }

  if (categoryId) {
    const { error } = await supabase
      .from("categories")
      .update({ name, description: description || null, sort_order })
      .eq("id", categoryId);
    if (error) return { status: "error", message: "Não foi possível salvar. Tente de novo." };
  } else {
    // Endereço (slug) gerado uma única vez, para não quebrar links depois.
    const base = slugify(name, "categoria");
    let slug = base;
    for (let n = 2; ; n++) {
      const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${n}`;
    }
    const { error } = await supabase.from("categories").insert({ name, slug, description: description || null, sort_order });
    if (error) return { status: "error", message: "Não foi possível criar a categoria. Tente de novo." };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: categoryId ? "Categoria salva." : `Categoria “${name}” criada.` };
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  // Só exclui categoria vazia; com produtos, o botão nem aparece.
  if (!count) {
    await supabase.from("categories").delete().eq("id", id);
    revalidatePath("/", "layout");
  }
}
