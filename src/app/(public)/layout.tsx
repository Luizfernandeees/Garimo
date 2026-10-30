import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { getCategories, getSiteSettings } from "@/lib/catalog";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);
  return (
    <div className="flex min-h-dvh flex-col pb-[env(safe-area-inset-bottom)]">
      <SiteHeader whatsappUrl={settings.whatsapp_channel_url} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter categories={categories} settings={settings} />
    </div>
  );
}
