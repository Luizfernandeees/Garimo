import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { erro } = await searchParams;

  // Admin já logado vai direto para o painel.
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (adminRow) redirect("/admin");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Voltar para o site da GARIMO" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-8 font-display text-2xl font-bold tracking-tight">Entrar no painel</h1>
        <p className="mt-1.5 text-sm text-ink/65">Acesso restrito à administração da GARIMO.</p>
        <div className="mt-7 rounded-[var(--radius-card)] border border-ink/10 bg-white p-6">
          <LoginForm
            initialError={erro === "sem-acesso" ? "Esta conta não tem acesso ao painel. Entre com a conta de administrador." : undefined}
          />
        </div>
      </div>
    </main>
  );
}
