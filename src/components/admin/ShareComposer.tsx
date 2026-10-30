"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, RefreshCw, Send, Share2 } from "lucide-react";
import { availableStyles, buildPost, productLink, type PostFormat, type PostProduct, type PostStyle } from "@/lib/post-templates";

type Props = {
  product: PostProduct & { affiliate_url: string };
  siteUrl: string;
  published: boolean;
};

export function ShareComposer({ product, siteUrl, published }: Props) {
  const styles = useMemo(() => availableStyles(product), [product]);
  const [style, setStyle] = useState<PostStyle>(styles.some((s) => s.id === "economia") ? "economia" : "direto");
  const [format, setFormat] = useState<PostFormat>("whatsapp");
  const [variant, setVariant] = useState(0);
  const [disclosure, setDisclosure] = useState(true);
  const generated = useMemo(
    () => buildPost(product, { style, format, variant, siteUrl, disclosure }),
    [product, style, format, variant, siteUrl, disclosure],
  );
  const [text, setText] = useState(generated);
  const [copied, setCopied] = useState<"texto" | "link" | null>(null);
  const [canShare, setCanShare] = useState(false);

  // Sempre que um modelo é escolhido, o texto é refeito (edições manuais
  // valem até a próxima troca de modelo).
  useEffect(() => setText(generated), [generated]);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  if (!published) {
    return (
      <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm text-ink/70">
        Publique o produto para divulgar. O link do post só funciona com o produto no site.
      </p>
    );
  }

  const link = productLink(siteUrl, product.slug, format === "whatsapp" ? "whatsapp" : "instagram");

  async function copy(value: string, what: "texto" | "link") {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Navegadores antigos ou sem permissão: cópia pelo método clássico.
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-ink text-white" : "bg-ink/5 text-ink/75 hover:bg-ink/10"
    }`;
  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Onde vai postar</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Formato">
            {(["whatsapp", "instagram"] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={format === f} onClick={() => setFormat(f)} className={chip(format === f)}>
                {f === "whatsapp" ? "WhatsApp" : "Instagram"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Modelo</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Modelo do post">
            {styles.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={style === s.id} onClick={() => setStyle(s.id)} className={chip(style === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/55">{styles.find((s) => s.id === style)?.hint}</p>
          {styles.length < 5 ? (
            <p className="mt-1 text-xs text-ink/45">
              Alguns modelos só aparecem quando o cadastro tem o dado necessário (preço anterior confirmado ou descrição com
              mais frases).
            </p>
          ) : null}
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={disclosure} onChange={(e) => setDisclosure(e.target.checked)} className="mt-0.5 size-4 accent-[#F07842]" />
          <span>
            <span className="font-medium">Incluir aviso de link de afiliado</span>
            <span className="block text-ink/55">Recomendado: deixa claro para o seguidor que é um link comissionado.</span>
          </span>
        </label>

        <div className="flex flex-wrap gap-2 border-t border-ink/8 pt-4">
          <button type="button" onClick={() => copy(link, "link")} className={`${btn} border border-ink/15 hover:border-ink/40`}>
            {copied === "link" ? <Check className="size-4 text-leaf" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copied === "link" ? "Link copiado" : "Copiar só o link"}
          </button>
          <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer" className={`${btn} border border-ink/15 hover:border-ink/40`}>
            <ExternalLink className="size-4" aria-hidden /> Abrir na Shopee
          </a>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="post-texto" className="text-sm font-medium">
            Texto do post
          </label>
          {style !== "minimalista" ? (
            <button type="button" onClick={() => setVariant((v) => v + 1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep hover:underline">
              <RefreshCw className="size-3.5" aria-hidden /> Outra versão
            </button>
          ) : null}
        </div>
        <textarea
          id="post-texto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full resize-y rounded-xl border border-ink/15 bg-[#fbfaf8] px-4 py-3 font-sans text-[15px] leading-relaxed focus:border-ink/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink/50">
          Você pode editar à vontade antes de copiar.{" "}
          {format === "whatsapp" ? "No WhatsApp, *texto* fica em negrito e ~texto~ fica riscado." : "O Instagram não deixa clicar em links na legenda; por isso o post indica o link da bio."}
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => copy(text, "texto")} className={`${btn} bg-brand text-ink hover:bg-brand-hover`}>
            {copied === "texto" ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied === "texto" ? "Texto copiado" : "Copiar texto"}
          </button>
          {format === "whatsapp" ? (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} bg-leaf text-white hover:bg-leaf-hover`}
            >
              <Send className="size-4" aria-hidden /> Abrir no WhatsApp
            </a>
          ) : null}
          {canShare ? (
            <button
              type="button"
              onClick={() => navigator.share({ text }).catch(() => undefined)}
              className={`${btn} bg-ink text-white hover:bg-ink/85`}
            >
              <Share2 className="size-4" aria-hidden /> Compartilhar
            </button>
          ) : null}
        </div>
        {format === "whatsapp" ? (
          <p className="mt-2 text-xs text-ink/50">
            Para o Canal do WhatsApp: use “Copiar texto” e cole no canal. O botão “Abrir no WhatsApp” serve para mandar em
            conversas e grupos.
          </p>
        ) : null}
      </div>
    </div>
  );
}
