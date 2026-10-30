"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/guard";
import { fieldErrorsFrom, productSchema, publishProblems, type ProductFormState } from "@/lib/product-schema";
import { STORAGE_BUCKET, storagePathFromUrl } from "@/lib/images";
import { slugify } from "@/lib/slug";
import type { ProductStatus } from "@/types/database";

function refreshSite() {
  // Home, categorias, páginas de produto e sitemap passam a refletir a
  // mudança na próxima visita, sem esperar o cache de 60 s.
  revalidatePath("/", "layout");
}

function friendlyDbError(message: string) {
  if (message.includes("products_published_needs_price")) return "Informe o preço atual para publicar.";
  if (message.includes("affiliate_url")) return "O link de afiliado não é válido.";
  if (message.includes("acesso negado")) return "Sua sessão não tem permissão de administrador. Entre novamente.";
  return "Não foi possível salvar. Tente de novo em instantes.";
}

export async function saveProduct(productId: string | null, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { supabase } = await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const input = parsed.data;

  // Situação atual (na edição) para saber o status de destino e quais
  // imagens deixaram de ser usadas.
  let currentStatus: ProductStatus = "draft";
  let previousImages: string[] = [];
  if (productId) {
    const { data: existing } = await supabase
      .from("products")
      .select("status, images:product_images(url)")
      .eq("id", productId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Este produto não existe mais." };
    currentStatus = existing.status;
    previousImages = existing.images.map((i) => i.url);
  }

  const targetStatus: ProductStatus =
    input.intent === "publish" ? "published" : input.intent === "draft" ? "draft" : currentStatus;

  if (targetStatus === "published") {
    const problems = publishProblems(input);
    if (Object.keys(problems).length) {
      return {
        status: "error",
        message:
          currentStatus === "published"
            ? "Este produto está publicado e precisa continuar completo. Revise os campos destacados."
            : "Faltam informações para publicar. O produto não foi salvo.",
        fieldErrors: problems,
      };
    }
  }

  const { data: saved, error } = await supabase.rpc("admin_save_product", {
    p_id: productId,
    p_data: {
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      current_price: input.current_price,
      previous_price: input.previous_price,
      previous_price_confirmed: input.previous_price_confirmed,
      affiliate_url: input.affiliate_url,
      category_id: input.category_id,
      is_featured: input.is_featured,
      status: targetStatus,
    },
    p_images: input.images,
  });

  if (error || !saved) {
    console.error("[produtos] salvar", error);
    return { status: "error", message: friendlyDbError(error?.message ?? "") };
  }

  // Remove do Storage as imagens enviadas que saíram da galeria.
  const kept = new Set(input.images.map((i) => i.url));
  const orphanPaths = previousImages
    .filter((url) => !kept.has(url))
    .map(storagePathFromUrl)
    .filter((p): p is string => Boolean(p));
  if (orphanPaths.length) {
    const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove(orphanPaths);
    if (removeError) console.error("[produtos] limpar imagens", removeError);
  }

  refreshSite();

  if (!productId) {
    redirect(`/admin/produtos/${saved.id}?aviso=${targetStatus === "published" ? "publicado" : "criado"}`);
  }
  return {
    status: "success",
    message: targetStatus !== currentStatus && targetStatus === "published" ? "Alterações salvas e produto publicado." : "Alterações salvas.",
  };
}

const NOTICE: Record<ProductStatus, string> = { published: "publicado", archived: "arquivado", draft: "rascunho" };

export async function changeStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "") as ProductStatus;
  if (!id || !["draft", "published", "archived"].includes(to)) redirect("/admin/produtos");

  if (to === "published") {
    const { data: p } = await supabase
      .from("products")
      .select("current_price, category_id, images:product_images(url)")
      .eq("id", id)
      .maybeSingle();
    if (!p) redirect("/admin/produtos");
    if (Object.keys(publishProblems(p)).length) redirect(`/admin/produtos/${id}?aviso=incompleto`);
  }

  const { error } = await supabase.from("products").update({ status: to }).eq("id", id);
  if (error) {
    console.error("[produtos] status", error);
    redirect(`/admin/produtos/${id}?aviso=erro`);
  }
  refreshSite();
  redirect(`/admin/produtos/${id}?aviso=${NOTICE[to]}`);
}
