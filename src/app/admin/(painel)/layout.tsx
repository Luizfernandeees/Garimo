import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/supabase/guard";
import { signOut } from "../actions";

// Toda página dentro de (painel) passa por esta verificação no servidor.
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15.5rem_1fr]">
      {/* Barra lateral (desktop) */}
      <aside className="hidden border-r border-ink/8 bg-white lg:flex lg:flex-col lg:px-4 lg:py-6">
        <Link href="/admin" className="px-3" aria-label="Painel GARIMO">
          <Logo size="sm" />
        </Link>
        <div className="mt-8 flex-1">
          <AdminNav />
        </div>
        <div className="space-y-1 border-t border-ink/8 pt-4">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden /> Ver o site
          </a>
          <p className="truncate px-4 pt-2 text-xs text-ink/50" title={user.email ?? undefined}>
            {user.email}
          </p>
          <form action={signOut}>
            <SubmitButton variant="ghost" pendingLabel="Saindo…" className="w-full justify-start">
              <LogOut className="size-4" aria-hidden /> Sair
            </SubmitButton>
          </form>
        </div>
      </aside>

      {/* Topo (celular e tablet) */}
      <header className="sticky top-0 z-20 border-b border-ink/8 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" aria-label="Painel GARIMO">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noopener" className="rounded-full p-2 text-ink/70 hover:bg-ink/5" aria-label="Ver o site">
              <ExternalLink className="size-5" aria-hidden />
            </a>
            <form action={signOut}>
              <SubmitButton variant="ghost" pendingLabel="Saindo…" className="px-3">
                <LogOut className="size-4" aria-hidden /> Sair
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="px-3 pb-3">
          <AdminNav orientation="horizontal" />
        </div>
      </header>

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
