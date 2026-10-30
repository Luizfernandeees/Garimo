import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/guard";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Configurações</h1>
      <p className="mt-1 text-sm text-ink/60">Textos e links que aparecem no site público.</p>
      <div className="mt-8">
        {error || !data ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível carregar as configurações. Confira se as migrations foram aplicadas no Supabase.
          </p>
        ) : (
          <SettingsForm values={data} />
        )}
      </div>
    </div>
  );
}
