import { z } from "zod";
import { isAllowedImageUrl, MAX_IMAGES } from "./images";
import { parsePrice } from "./price";

export type ProductField =
  | "affiliate_url"
  | "name"
  | "description"
  | "current_price"
  | "previous_price"
  | "category_id"
  | "images";

export type ProductFormState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ProductField, string>>;
};

// Aceita apenas links da Shopee. O texto é guardado exatamente como foi
// colado (só os espaços das pontas são removidos).
const SHOPEE_HOSTS = /^(?:([a-z0-9-]+\.)*shopee\.com\.br|shp\.ee)$/i;
export function isShopeeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && SHOPEE_HOSTS.test(url.hostname) && !/\s/.test(value);
  } catch {
    return false;
  }
}

const price = (label: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const parsed = parsePrice(v);
      if (Number.isNaN(parsed)) {
        ctx.addIssue({ code: "custom", message: `${label}: use só números, como 79,90.` });
        return z.NEVER;
      }
      if (parsed !== null && parsed > 99_999_999) {
        ctx.addIssue({ code: "custom", message: `${label}: valor alto demais.` });
        return z.NEVER;
      }
      return parsed;
    });

export const productSchema = z
  .object({
    affiliate_url: z
      .string()
      .trim()
      .min(1, "Cole o link de afiliado da Shopee.")
      .max(2000, "Link longo demais.")
      .refine(isShopeeUrl, "Use um link da Shopee que comece com https:// (shopee.com.br, s.shopee.com.br ou shp.ee)."),
    name: z.string().trim().min(3, "Use pelo menos 3 caracteres.").max(200, "Use no máximo 200 caracteres."),
    description: z.string().trim().max(5000, "Use no máximo 5.000 caracteres.").optional().default(""),
    current_price: price("Preço atual"),
    previous_price: price("Preço anterior"),
    previous_price_confirmed: z.literal("on").optional().transform(Boolean),
    is_featured: z.literal("on").optional().transform(Boolean),
    category_id: z
      .string()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || z.uuid().safeParse(v).success, "Categoria inválida."),
    images: z
      .string()
      .optional()
      .transform((v, ctx) => {
        try {
          const list = JSON.parse(v || "[]") as unknown;
          if (!Array.isArray(list)) throw new Error();
          const urls = list.map((i) => String((i as { url?: unknown })?.url ?? ""));
          if (urls.length > MAX_IMAGES) {
            ctx.addIssue({ code: "custom", message: `Use no máximo ${MAX_IMAGES} imagens.` });
            return z.NEVER;
          }
          if (urls.some((u) => !isAllowedImageUrl(u))) {
            ctx.addIssue({ code: "custom", message: "Há uma imagem de origem não permitida. Envie o arquivo ou use um link da CDN da Shopee." });
            return z.NEVER;
          }
          return [...new Set(urls)].map((url) => ({ url }));
        } catch {
          ctx.addIssue({ code: "custom", message: "Lista de imagens inválida." });
          return z.NEVER;
        }
      }),
    intent: z.enum(["draft", "publish", "save"]),
  })
  .superRefine((v, ctx) => {
    if (v.previous_price_confirmed) {
      if (v.previous_price === null) {
        ctx.addIssue({ code: "custom", path: ["previous_price"], message: "Informe o preço anterior ou desmarque a confirmação." });
      } else if (v.current_price !== null && v.previous_price <= v.current_price) {
        ctx.addIssue({ code: "custom", path: ["previous_price"], message: "Para mostrar desconto, o preço anterior precisa ser maior que o atual." });
      }
    }
  });

export type ProductInput = z.infer<typeof productSchema>;

// Requisitos para um produto aparecer no site.
export function publishProblems(p: { current_price: number | null; category_id: string | null; images: { url: string }[] }) {
  const errors: Partial<Record<ProductField, string>> = {};
  if (p.current_price === null) errors.current_price = "Informe o preço atual para publicar.";
  if (!p.category_id) errors.category_id = "Escolha uma categoria para publicar.";
  if (!p.images.length) errors.images = "Adicione pelo menos uma imagem para publicar.";
  return errors;
}

export function fieldErrorsFrom(error: z.ZodError) {
  const out: Partial<Record<ProductField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as ProductField;
    out[key] ??= issue.message;
  }
  return out;
}
