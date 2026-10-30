// Gerador de posts SEM inteligência artificial: modelos de texto que só
// usam dados reais do cadastro. Nada de preço, desconto, cupom, estoque ou
// urgência que não esteja no banco.

import { formatPrice } from "./format";

export type PostProduct = {
  name: string;
  slug: string;
  description: string | null;
  current_price: number | null;
  previous_price: number | null;
  discount_percent: number | null;
  category: string | null;
};

export type PostFormat = "whatsapp" | "instagram";
export type PostStyle = "direto" | "achado" | "economia" | "beneficios" | "minimalista";

export const STYLES: { id: PostStyle; label: string; hint: string }[] = [
  { id: "direto", label: "Direto", hint: "Nome, preço e link." },
  { id: "achado", label: "Achado", hint: "Abre apresentando a descoberta e usa o começo da descrição." },
  { id: "economia", label: "Economia", hint: "Destaca o desconto. Só aparece com preço anterior confirmado." },
  { id: "beneficios", label: "Benefícios", hint: "Tópicos tirados da descrição. Precisa de pelo menos 2 frases." },
  { id: "minimalista", label: "Minimalista", hint: "Só o essencial, em três linhas." },
];

const OPENERS: Record<"achado" | "economia", string[]> = {
  achado: [
    "Achado da GARIMO",
    "Olha que achado",
    "Separei esse achado pra você",
    "Vale a pena conferir",
    "Mais um achado na vitrine",
  ],
  economia: [
    "Preço que vale conferir",
    "Olha a diferença no preço",
    "Bom preço encontrado",
    "Economia de verdade",
  ],
};
const EMOJI = ["✨", "👀", "🛍️", "💡"];

// Frase que indica, de forma leve, que o link é de afiliado.
export const DISCLOSURE = "💛 Comprando pelo link você ajuda a GARIMO a continuar garimpando";

// Frases da descrição, exatamente como foram cadastradas.
export function descriptionSentences(description: string | null) {
  return (description ?? "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
    .filter((s) => s.length >= 3 && s.length <= 120);
}

export function availableStyles(p: PostProduct) {
  return STYLES.filter((s) => {
    if (s.id === "economia") return p.discount_percent !== null && p.previous_price !== null;
    if (s.id === "beneficios") return descriptionSentences(p.description).length >= 2;
    return true;
  });
}

export function productLink(siteUrl: string, slug: string, source: string) {
  return `${siteUrl}/ir/${slug}?src=${source}`;
}

function shortName(name: string) {
  const words = name.split(/\s+/);
  return words.length <= 4 ? name : words.slice(0, 4).join(" ");
}

function hashtag(text: string) {
  return (
    "#" +
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toLowerCase()
  );
}

export function buildPost(
  p: PostProduct,
  opts: { style: PostStyle; format: PostFormat; variant: number; siteUrl: string; disclosure: boolean },
) {
  const wa = opts.format === "whatsapp";
  const b = (t: string) => (wa ? `*${t}*` : t);
  const price = formatPrice(p.current_price);
  const prev = p.discount_percent !== null ? formatPrice(p.previous_price) : null;
  const pick = <T,>(list: T[]) => list[Math.abs(opts.variant) % list.length];
  const emoji = pick(EMOJI);

  const priceLine = price
    ? prev
      ? wa
        ? `De ~${prev}~ por ${b(price)} (${p.discount_percent}% a menos)`
        : `De ${prev} por ${price} (${p.discount_percent}% a menos)`
      : `💰 ${b(price)}`
    : null;

  const linkLine = wa
    ? `🛒 Ver na Shopee: ${productLink(opts.siteUrl, p.slug, "whatsapp")}`
    : `🔗 Link na bio: procure por “${shortName(p.name)}” no site da GARIMO`;

  const sentences = descriptionSentences(p.description);
  const lines: (string | null)[] = [];

  switch (opts.style) {
    case "direto":
      lines.push(b(p.name), "", priceLine, "", linkLine);
      break;
    case "achado":
      lines.push(`${emoji} ${pick(OPENERS.achado)}`, "", b(p.name), sentences[0] ?? null, "", priceLine, "", linkLine);
      break;
    case "economia":
      lines.push(`📉 ${pick(OPENERS.economia)}`, "", b(p.name), priceLine, "", linkLine);
      break;
    case "beneficios":
      lines.push(b(p.name), "", ...sentences.slice(0, 4).map((s) => `• ${s}`), "", priceLine, "", linkLine);
      break;
    case "minimalista":
      lines.push(p.name, price, wa ? productLink(opts.siteUrl, p.slug, "whatsapp") : "Link na bio");
      break;
  }

  if (!wa) {
    const tags = ["#garimo", "#achadosshopee", "#achados", p.category ? hashtag(p.category) : null].filter(Boolean);
    lines.push("", tags.join(" "));
  }
  if (opts.disclosure) {
    lines.push("", DISCLOSURE);
  }

  // Remove linhas nulas e linhas em branco repetidas.
  return lines
    .filter((l): l is string => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
