import { MessageCircle } from "lucide-react";

export function WhatsAppBand({ url }: { url: string }) {
  return (
    <section
      aria-labelledby="canal-whatsapp"
      className="mt-16 flex flex-col items-start gap-6 rounded-[var(--radius-panel)] bg-leaf px-6 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10"
    >
      <div className="max-w-xl">
        <h2 id="canal-whatsapp" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Os achados chegam primeiro no Canal do WhatsApp
        </h2>
        <p className="mt-2 text-white/85">
          Siga o canal da GARIMO para ver as novidades sem precisar entrar no site. Você recebe as postagens e pode sair
          quando quiser.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-ink transition-colors hover:bg-cream"
      >
        <MessageCircle className="size-5 text-leaf" aria-hidden />
        Seguir o canal
      </a>
    </section>
  );
}
