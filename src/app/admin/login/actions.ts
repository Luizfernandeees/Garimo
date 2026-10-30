"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type LoginState = { error?: string; email?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha.").max(200),
});

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos.", email };
  }
  if (!isSupabaseConfigured) {
    return { error: "O Supabase ainda não foi configurado. Confira as variáveis de ambiente.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    // Mensagem genérica: não revela se o e-mail existe.
    const tooMany = error?.status === 429;
    return {
      error: tooMany
        ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
        : "E-mail ou senha incorretos.",
      email,
    };
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { error: "Esta conta não tem acesso ao painel.", email };
  }

  redirect("/admin");
}
