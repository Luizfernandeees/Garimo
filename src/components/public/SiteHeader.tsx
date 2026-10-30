import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SearchForm } from "./SearchForm";

export function SiteHeader({ whatsappUrl, query }: { whatsappUrl: string | null; query?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <div className="container-page flex items-center gap-4 py-3 sm:gap-8">
        <Link href="/" aria-label="GARIMO, página inicial" className="shrink-0">
          <Logo />
        </Link>
        <div className="hidden flex-1 md:block md:max-w-xl">
          <SearchForm defaultValue={query} id="busca-topo" />
        </div>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-leaf px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-leaf-hover sm:px-4"
          >
            <MessageCircle className="size-4" aria-hidden />
            <span className="hidden sm:inline">Canal do WhatsApp</span>
            <span className="sm:hidden">Canal</span>
          </a>
        ) : null}
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchForm defaultValue={query} id="busca-topo-mobile" />
      </div>
    </header>
  );
}
