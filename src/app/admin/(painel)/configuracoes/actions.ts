"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/guard";

export type SettingsState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"hero_title" | "hero_subtitle" | "whatsapp_channel_url" | "instagram_url", string>>;
};

const optionalUrl = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || pattern.test(v), message);

const schema = z.object({
  hero_title: z.string().trim().min(3, "Use pelo menos 3 caracteres.").max(90, "Use no máximo 90 caracteres."),
  hero_subtitle: z.string().trim().min(10, "Use pelo menos 10 caracteres.").max(220, "Use no máximo 220 caracteres."),
  whatsapp_channel_url: optionalUrl(
    /^https:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+\/?$/i,
    "Cole o link do canal, no formato https://whatsapp.com/channel/…",
  ),
  instagram_url: optionalUrl(
    /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+\/?$/i,
    "Cole o link do perfil, no formato https://instagram.com/seuperfil",
  ),
});

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: SettingsState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<SettingsState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Revise os campos destacados.", fieldErrors };
  }

  const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) {
    console.error("[configuracoes]", error);
    return { status: "error", message: "Não foi possível salvar. Tente de novo em instantes." };
  }

  // Atualiza o site público imediatamente.
  revalidatePath("/", "layout");
  return { status: "success", message: "Configurações salvas. O site já foi atualizado." };
}
