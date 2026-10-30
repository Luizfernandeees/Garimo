import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import type { Category, SiteSettings } from "@/lib/catalog";

export function SiteFooter({ categories, settings }: { categories: Category[]; settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-ink text-white/80">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo tone="dark" />
          <p className="mt-4 font-display text-lg font-semibold text-white">Boas descobertas, bons preços.</p>
          <p className="mt-2 text-sm leading-relaxed">
            A GARIMO seleciona produtos e ofertas da Shopee para ajudar você a encontrar boas oportunidades de compra.
          </p>
        </div>

        {categories.length ? (
          <nav aria-label="Categorias no rodapé">
            <h2 className="font-display text-sm font-semibold text-white">Categorias</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/categoria/${c.slug}`} className="hover:text-white hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {settings.whatsapp_channel_url || settings.instagram_url ? (
          <div>
            <h2 className="font-display text-sm font-semibold text-white">Acompanhe</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {settings.whatsapp_channel_url ? (
                <li>
                  <a href={settings.whatsapp_channel_url} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                    Canal do WhatsApp
                  </a>
                </li>
              ) : null}
              {settings.instagram_url ? (
                <li>
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page space-y-2 py-6 text-xs leading-relaxed text-white/65">
          <p>
            A GARIMO participa do programa de afiliados da Shopee. Os links para a Shopee são links de afiliado: podemos
            receber uma comissão por compras elegíveis, sem custo adicional para você.
          </p>
          <p>
            Preços e disponibilidade são definidos pelos vendedores na Shopee e podem mudar a qualquer momento. Confira as
            condições na página da Shopee antes de comprar. A GARIMO é um site independente, sem vínculo de
            administração ou patrocínio com a Shopee.
          </p>
          <p className="pt-2">© {year} GARIMO</p>
        </div>
      </div>
    </footer>
  );
}
