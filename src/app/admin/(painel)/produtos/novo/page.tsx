import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/supabase/guard";
import { saveProduct } from "../actions";

export const metadata: Metadata = { title: "Cadastrar produto" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("sort_order").order("name");

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/produtos" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Produtos
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">Cadastrar produto</h1>
      <p className="mt-1 text-sm text-ink/60">Salve como rascunho para revisar depois, ou publique direto no site.</p>
      <div className="mt-8">
        <ProductForm
          action={saveProduct.bind(null, null)}
          categories={categories ?? []}
          initial={{
            affiliate_url: "",
            name: "",
            description: "",
            current_price: "",
            previous_price: "",
            previous_price_confirmed: false,
            category_id: "",
            is_featured: false,
            images: [],
          }}
        />
      </div>
    </div>
  );
}
