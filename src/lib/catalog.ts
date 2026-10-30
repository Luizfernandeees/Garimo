import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";
import { sanitizeSearch } from "@/lib/format";
import type { Tables } from "@/types/database";

// Tudo aqui roda no servidor com a chave publicável: o RLS garante que
// só produtos com status "published" sejam retornados.

const CARD_FIELDS =
  "id, name, slug, current_price, previous_price, discount_percent, image_url, published_at, category:categories(name, slug)";

export type ProductCardData = Pick<
  Tables<"products">,
  "id" | "name" | "slug" | "current_price" | "previous_price" | "discount_percent" | "image_url" | "published_at"
> & { category: { name: string; slug: string } | null };

export type Category = Tables<"categories">;
export type SiteSettings = Tables<"site_settings">;

export const PAGE_SIZE = 24;

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  hero_title: "Boas descobertas, bons preços.",
  hero_subtitle: "A GARIMO seleciona produtos e ofertas da Shopee para você encontrar boas oportunidades de compra.",
  whatsapp_channel_url: null,
  instagram_url: null,
  updated_at: new Date(0).toISOString(),
};

// Falhas de rede/banco não derrubam o site: registram o erro e devolvem
// um valor vazio, e a página mostra o estado vazio correspondente.
async function safe<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return fallback;
  try {
    return await run();
  } catch (error) {
    console.error(`[catalog] ${label}:`, error);
    return fallback;
  }
}

function published() {
  return createPublicClient().from("products").select(CARD_FIELDS, { count: "exact" }).eq("status", "published");
}

export function getSiteSettings() {
  return safe("settings", DEFAULT_SETTINGS, async () => {
    const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data ?? DEFAULT_SETTINGS;
  });
}

export function getCategories() {
  return safe<Category[]>("categories", [], async () => {
    const { data, error } = await createPublicClient()
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) throw error;
    return data;
  });
}

export function getCategoryBySlug(slug: string) {
  return safe<Category | null>("category", null, async () => {
    const { data, error } = await createPublicClient().from("categories").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data;
  });
}

export function getHomeProducts() {
  const empty = { featured: [] as ProductCardData[], deals: [] as ProductCardData[], latest: [] as ProductCardData[] };
  return safe("home", empty, async () => {
    const [featured, deals, latest] = await Promise.all([
      published().eq("is_featured", true).order("published_at", { ascending: false }).limit(8),
      published()
        .not("discount_percent", "is", null)
        .order("discount_percent", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(8),
      published().order("published_at", { ascending: false }).limit(12),
    ]);
    for (const r of [featured, deals, latest]) if (r.error) throw r.error;
    return {
      featured: (featured.data ?? []) as ProductCardData[],
      deals: (deals.data ?? []) as ProductCardData[],
      latest: (latest.data ?? []) as ProductCardData[],
    };
  });
}

export type ProductPage = ProductCardData &
  Pick<Tables<"products">, "description" | "updated_at"> & {
    images: Pick<Tables<"product_images">, "id" | "url" | "alt">[];
  };

export function getProductBySlug(slug: string) {
  return safe<ProductPage | null>("product", null, async () => {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(`${CARD_FIELDS}, description, updated_at, images:product_images(id, url, alt, sort_order)`)
      .eq("status", "published")
      .eq("slug", slug)
      .order("sort_order", { referencedTable: "images" })
      .maybeSingle();
    if (error) throw error;
    return data as ProductPage | null;
  });
}

export function getRelatedProducts(categorySlug: string | undefined, excludeId: string) {
  return safe<ProductCardData[]>("related", [], async () => {
    if (!categorySlug) return [];
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return [];
    const { data, error } = await published()
      .eq("category_id", category.id)
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(4);
    if (error) throw error;
    return (data ?? []) as ProductCardData[];
  });
}

export type ProductList = { items: ProductCardData[]; total: number };

export function getCategoryProducts(categoryId: string, page: number) {
  return safe<ProductList>("category-products", { items: [], total: 0 }, async () => {
    const from = (page - 1) * PAGE_SIZE;
    const { data, error, count } = await published()
      .eq("category_id", categoryId)
      .order("published_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    return { items: (data ?? []) as ProductCardData[], total: count ?? 0 };
  });
}

// Pesquisa por nome, palavra-chave (descrição) e nome de categoria,
// com filtro opcional por categoria.
export function searchProducts(params: { q?: string; categorySlug?: string; page: number }) {
  return safe<ProductList>("search", { items: [], total: 0 }, async () => {
    const term = sanitizeSearch(params.q);
    const supabase = createPublicClient();
    let query = published();

    if (params.categorySlug) {
      const category = await getCategoryBySlug(params.categorySlug);
      if (!category) return { items: [], total: 0 };
      query = query.eq("category_id", category.id);
    }

    if (term) {
      const { data: matchingCategories } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${term}%`);
      const filters = [`name.ilike.%${term}%`, `description.ilike.%${term}%`];
      const ids = (matchingCategories ?? []).map((c) => c.id);
      if (ids.length) filters.push(`category_id.in.(${ids.join(",")})`);
      query = query.or(filters.join(","));
    }

    const from = (params.page - 1) * PAGE_SIZE;
    const { data, error, count } = await query
      .order("published_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    return { items: (data ?? []) as ProductCardData[], total: count ?? 0 };
  });
}

export function getSitemapData() {
  return safe("sitemap", { products: [] as { slug: string; updated_at: string }[], categories: [] as { slug: string }[] }, async () => {
    const supabase = createPublicClient();
    const [products, categories] = await Promise.all([
      supabase.from("products").select("slug, updated_at").eq("status", "published").limit(5000),
      supabase.from("categories").select("slug"),
    ]);
    if (products.error) throw products.error;
    if (categories.error) throw categories.error;
    return { products: products.data, categories: categories.data };
  });
}
