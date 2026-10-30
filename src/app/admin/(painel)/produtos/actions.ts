"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/guard";
import {
  fieldErrorsFrom,
  isShopeeUrl,
  productSchema,
  publishProblems,
  type ExistingProduct,
  type ProductFormState,
} from "@/lib/product-schema";
import { resolveItemKey } from "@/lib/shopee-link";
import { STORAGE_BUCKET, storagePathFromUrl } from "@/lib/images";
import { slugify } from "@/lib/slug";
import type { ProductStatus } from "@/types/database";

function refreshSite() {
  // Home, categorias, páginas de produto e sitemap passam a refletir a
  // mudança na próxima visita, sem esperar o cache de 60 s.
  revalidatePath("/", "layout");
}

type Db = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const STATUS_PT: Record<ExistingProduct["status"], string> = { draft: "rascunho", published: "publicado", archived: "arquivado" };

// Procura um produto já cadastrado com o mesmo link ou o mesmo item da Shopee.
async function findDuplicate(supabase: Db, url: string, itemKey: string | null, excludeId: string | null) {
  const byLink = supabase.from("products").select("id, name, status").eq("affiliate_url", url);
  const { data: sameLink } = await (excludeId ? byLink.neq("id", excludeId) : byLink).limit(1).maybeSingle();
  if (sameLink) return { product: sameLink as ExistingProduct, reason: "link" as const };
  if (itemKey) {
    const byItem = supabase.from("products").select("id, name, status").eq("shopee_item_key", itemKey);
    const { data: sameItem } = await (excludeId ? byItem.neq("id", excludeId) : byItem).limit(1).maybeSingle();
    if (sameItem) return { product: sameItem as ExistingProduct, reason: "item" as const };
  }
  return null;
}

function duplicateMessage(d: { product: ExistingProduct; reason: "link" | "item" }) {
  return d.reason === "link"
    ? `Este link já está cadastrado em “${d.product.name}” (${STATUS_PT[d.product.status]}).`
    : `Este produto da Shopee já está cadastrado como “${d.product.name}” (${STATUS_PT[d.product.status]}), com outro link de afiliado.`;
}

// Verificação rápida feita assim que o link é colado no formulário.
export async function checkProductLink(url: string, productId: string | null): Promise<{ message: string; product: ExistingProduct } | null> {
  const { supabase } = await requireAdmin();
  const clean = url.trim();
  if (!isShopeeUrl(clean)) return null;
  const dup = await findDuplicate(supabase, clean, await resolveItemKey(clean), productId);
  return dup ? { message: duplicateMessage(dup), product: dup.product } : null;
}

function friendlyDbError(message: string) {
  if (message.includes("products_affiliate_url_key")) return "Este link de afiliado já está cadastrado em outro produto.";
  if (message.includes("products_shopee_item_key")) return "Este produto da Shopee já está cadastrado.";
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
  let previousLink: string | null = null;
  let previousItemKey: string | null = null;
  if (productId) {
    const { data: existing } = await supabase
      .from("products")
      .select("status, affiliate_url, shopee_item_key, images:product_images(url)")
      .eq("id", productId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Este produto não existe mais." };
    currentStatus = existing.status;
    previousImages = existing.images.map((i) => i.url);
    previousLink = existing.affiliate_url;
    previousItemKey = existing.shopee_item_key;
  }

  // ---- Bloqueio de repetidos -------------------------------------------
  const linkChanged = input.affiliate_url !== previousLink;
  const itemKey = linkChanged ? await resolveItemKey(input.affiliate_url) : previousItemKey;
  if (linkChanged) {
    const dup = await findDuplicate(supabase, input.affiliate_url, itemKey, productId);
    if (dup) {
      return {
        status: "error",
        message: "Produto repetido: nada foi salvo.",
        fieldErrors: { affiliate_url: duplicateMessage(dup) },
        duplicate: dup.product,
      };
    }
  }
  // Nome parecido com outro produto: pede confirmação (só no cadastro).
  if (!productId && !input.confirm_similar) {
    const { data: similar } = await supabase.rpc("admin_similar_products", { p_name: input.name });
    if (similar?.length) {
      return {
        status: "warning",
        message: "Já existe produto com nome parecido. Confira se não é o mesmo antes de salvar.",
        similar: similar.map((p) => ({ id: p.id, name: p.name, status: p.status })),
      };
    }
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
      ...(linkChanged ? { shopee_item_key: itemKey } : {}),
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
