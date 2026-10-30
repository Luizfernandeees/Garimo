import { BagIcon } from "@/components/brand/BagIcon";
import { CategoryNav } from "@/components/public/CategoryNav";
import { EmptyState } from "@/components/public/EmptyState";
import { ProductGrid } from "@/components/public/ProductGrid";
import { SearchForm } from "@/components/public/SearchForm";
import { Section } from "@/components/public/Section";
import { WhatsAppBand } from "@/components/public/WhatsAppBand";
import { getCategories, getHomeProducts, getSiteSettings } from "@/lib/catalog";

// Página estática, renovada a cada minuto e também sob demanda quando o
// painel altera algo (revalidatePath).
export const revalidate = 60;

export default async function HomePage() {
  const [settings, categories, { featured, deals, latest }] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getHomeProducts(),
  ]);
  const hasProducts = latest.length > 0;

  return (
    <div className="container-page pt-6 sm:pt-8">
      {/* Banner principal */}
      <section className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[var(--radius-panel)] bg-cream px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
            {settings.hero_title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/75 sm:text-lg">{settings.hero_subtitle}</p>
          <div className="mt-8 max-w-xl">
            <SearchForm size="lg" id="busca-hero" />
          </div>
        </div>
        <BagIcon animateRays className="hidden h-auto w-64 text-brand lg:block xl:w-80" />
      </section>

      <div className="mt-6">
        <CategoryNav categories={categories} active="__home" />
      </div>

      {!hasProducts ? (
        <div className="mt-10">
          <EmptyState title="Os primeiros achados estão sendo selecionados">
            <p>
              Em breve esta vitrine vai reunir produtos escolhidos a dedo na Shopee.
              {settings.whatsapp_channel_url ? " Siga o Canal do WhatsApp para saber quando chegarem." : ""}
            </p>
          </EmptyState>
        </div>
      ) : null}

      {featured.length ? (
        <Section title="Em destaque">
          <ProductGrid products={featured} priorityCount={2} />
        </Section>
      ) : null}

      {deals.length ? (
        <Section title="Ofertas selecionadas" note="Descontos calculados sobre preços anteriores confirmados.">
          <ProductGrid products={deals} priorityCount={featured.length ? 0 : 2} />
        </Section>
      ) : null}

      {latest.length ? (
        <Section title="Chegaram agora" href="/busca" hrefLabel="Ver todos os produtos">
          <ProductGrid products={latest} priorityCount={featured.length || deals.length ? 0 : 2} />
        </Section>
      ) : null}

      {settings.whatsapp_channel_url ? <WhatsAppBand url={settings.whatsapp_channel_url} /> : null}
    </div>
  );
}
