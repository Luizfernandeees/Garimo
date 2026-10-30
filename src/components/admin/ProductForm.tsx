"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { ProductCard } from "@/components/public/ProductCard";
import { ImageManager, type FormImage } from "./ImageManager";
import { discountPercent, parsePrice } from "@/lib/price";
import type { ProductFormState } from "@/lib/product-schema";
import type { ProductStatus } from "@/types/database";

export type ProductFormValues = {
  affiliate_url: string;
  name: string;
  description: string;
  current_price: string;
  previous_price: string;
  previous_price_confirmed: boolean;
  category_id: string;
  is_featured: boolean;
  images: FormImage[];
};

type Category = { id: string; name: string; slug: string };

const input =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-[15px] placeholder:text-ink/40 focus:border-ink/50 focus:outline-none aria-[invalid=true]:border-red-600";

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label} {optional ? <span className="font-normal text-ink/50">(opcional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-ink/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButtons({ isNew, status }: { isNew: boolean; status?: ProductStatus }) {
  const { pending, data } = useFormStatus();
  const intent = data?.get("intent");
  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70";
  const spin = (which: string) => (pending && intent === which ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null);

  if (isNew) {
    return (
      <>
        <button type="submit" name="intent" value="publish" disabled={pending} className={`${btn} bg-brand text-ink hover:bg-brand-hover`}>
          {spin("publish")} Salvar e publicar
        </button>
        <button type="submit" name="intent" value="draft" disabled={pending} className={`${btn} bg-ink text-white hover:bg-ink/85`}>
          {spin("draft")} Salvar como rascunho
        </button>
      </>
    );
  }
  return (
    <>
      <button type="submit" name="intent" value="save" disabled={pending} className={`${btn} bg-ink text-white hover:bg-ink/85`}>
        {spin("save")} Salvar alterações
      </button>
      {status === "draft" ? (
        <button type="submit" name="intent" value="publish" disabled={pending} className={`${btn} bg-brand text-ink hover:bg-brand-hover`}>
          {spin("publish")} Salvar e publicar
        </button>
      ) : null}
    </>
  );
}

export function ProductForm({
  action,
  initial,
  categories,
  status,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  initial: ProductFormValues;
  categories: Category[];
  status?: ProductStatus;
}) {
  const isNew = !status;
  const [state, formAction] = useActionState(action, {});
  const [v, setV] = useState<ProductFormValues>(initial);
  // Erros vêm do servidor; somem do campo assim que ele é editado.
  const [e, setErrors] = useState<NonNullable<ProductFormState["fieldErrors"]>>({});
  useEffect(() => setErrors(state.fieldErrors ?? {}), [state]);
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setV((old) => ({ ...old, [key]: value }));
    setErrors((old) => {
      if (!(key in old)) return old;
      const next = { ...old };
      delete next[key as keyof typeof next];
      return next;
    });
  };
  const a11y = (id: keyof ProductFormValues) => ({
    id,
    name: id,
    "aria-invalid": e[id as keyof typeof e] ? true : undefined,
    "aria-describedby": e[id as keyof typeof e] ? `${id}-erro` : `${id}-dica`,
  });

  // Prévia ao vivo do cartão como ele aparecerá no site.
  const preview = useMemo(() => {
    const current = parsePrice(v.current_price);
    const previous = parsePrice(v.previous_price);
    const cat = categories.find((c) => c.id === v.category_id);
    const ok = (n: number | null) => (n === null || Number.isNaN(n) ? null : n);
    return {
      id: "previa",
      name: v.name.trim() || "Nome do produto",
      slug: "previa",
      current_price: ok(current),
      previous_price: ok(previous),
      discount_percent: discountPercent(ok(current), ok(previous), v.previous_price_confirmed),
      image_url: v.images[0]?.url ?? null,
      published_at: null,
      category: cat ? { name: cat.name, slug: cat.slug } : null,
    };
  }, [v, categories]);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <input type="hidden" name="images" value={JSON.stringify(v.images)} />

      <div className="space-y-6">
        {state.message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              state.status === "error" ? "bg-red-50 text-red-800" : "bg-leaf/10 text-leaf"
            }`}
          >
            {state.status === "success" ? <CheckCircle2 className="size-4" aria-hidden /> : null}
            {state.message}
          </p>
        ) : null}

        <fieldset className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">Link da Shopee</legend>
          <Field
            id="affiliate_url"
            label="Link de afiliado"
            hint="Cole o link gerado no painel de afiliados da Shopee. Ele é salvo exatamente como está, com todos os parâmetros."
            error={e.affiliate_url}
          >
            <input
              {...a11y("affiliate_url")}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://s.shopee.com.br/…"
              value={v.affiliate_url}
              onChange={(ev) => set("affiliate_url", ev.target.value)}
              className={input}
            />
          </Field>
        </fieldset>

        <fieldset className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">Produto</legend>
          <Field id="name" label="Nome" hint="Como o produto vai aparecer no site. Até 200 caracteres." error={e.name}>
            <input {...a11y("name")} maxLength={200} value={v.name} onChange={(ev) => set("name", ev.target.value)} className={input} />
          </Field>
          <Field id="description" label="Descrição" optional hint="Use só informações que constam na página da Shopee." error={e.description}>
            <textarea
              {...a11y("description")}
              rows={6}
              maxLength={5000}
              value={v.description}
              onChange={(ev) => set("description", ev.target.value)}
              className={`${input} resize-y`}
            />
          </Field>
          <Field id="category_id" label="Categoria" hint="Obrigatória para publicar." error={e.category_id}>
            <select {...a11y("category_id")} value={v.category_id} onChange={(ev) => set("category_id", ev.target.value)} className={input}>
              <option value="">Escolha uma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="is_featured"
              checked={v.is_featured}
              onChange={(ev) => set("is_featured", ev.target.checked)}
              className="mt-0.5 size-4 accent-[#F07842]"
            />
            <span>
              <span className="font-medium">Mostrar em “Em destaque”</span>
              <span className="block text-ink/55">Aparece no topo da página inicial.</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">Preço</legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="current_price" label="Preço atual (R$)" hint="Obrigatório para publicar." error={e.current_price}>
              <input
                {...a11y("current_price")}
                inputMode="decimal"
                placeholder="79,90"
                value={v.current_price}
                onChange={(ev) => set("current_price", ev.target.value)}
                className={input}
              />
            </Field>
            <Field id="previous_price" label="Preço anterior (R$)" optional hint="Preço que aparecia antes da oferta." error={e.previous_price}>
              <input
                {...a11y("previous_price")}
                inputMode="decimal"
                placeholder="129,90"
                value={v.previous_price}
                onChange={(ev) => set("previous_price", ev.target.value)}
                className={input}
              />
            </Field>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="previous_price_confirmed"
              checked={v.previous_price_confirmed}
              onChange={(ev) => set("previous_price_confirmed", ev.target.checked)}
              className="mt-0.5 size-4 accent-[#F07842]"
            />
            <span>
              <span className="font-medium">Confirmei o preço anterior na Shopee</span>
              <span className="block text-ink/55">
                Só com esta confirmação o site mostra o preço riscado e o desconto, calculado automaticamente.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="min-w-0 rounded-[var(--radius-card)] border border-ink/8 bg-white p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-semibold">Imagens</legend>
          <ImageManager images={v.images} onChange={(imgs) => set("images", imgs)} error={e.images} />
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SubmitButtons isNew={isNew} status={status} />
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Prévia do cartão">
        <p className="mb-2 text-sm font-medium text-ink/60">Prévia no site</p>
        <div className="pointer-events-none select-none" aria-hidden>
          <ProductCard product={preview} />
        </div>
      </aside>
    </form>
  );
}
