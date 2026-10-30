import { NextResponse, userAgent, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { env, isSupabaseConfigured } from "@/lib/env";

// Rota de saída para a Shopee:
// 1. registra o clique (sem IP e sem dados pessoais);
// 2. redireciona para o link de afiliado EXATAMENTE como foi cadastrado.
//
// O cabeçalho Location é montado à mão, sem passar por `new URL()`, para
// que nenhum caractere ou parâmetro de rastreamento seja normalizado.

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LINK_PREVIEW_BOTS = /whatsapp|facebookexternalhit|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|bot|crawler|spider|preview/i;

function inferSource(request: NextRequest) {
  const explicit = request.nextUrl.searchParams.get("src");
  if (explicit) return explicit;
  const referer = request.headers.get("referer") ?? "";
  if (!referer) return "direto";
  try {
    const host = new URL(referer).hostname;
    if (host === new URL(env.siteUrl).hostname) return "site";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("whatsapp")) return "whatsapp";
    if (host.includes("facebook")) return "facebook";
    if (host.includes("google")) return "google";
    return "outro";
  } catch {
    return "direto";
  }
}

function isPrefetch(request: NextRequest) {
  const purpose = `${request.headers.get("purpose") ?? ""} ${request.headers.get("sec-purpose") ?? ""}`;
  return /prefetch|prerender/i.test(purpose) || request.headers.get("next-router-prefetch") === "1";
}

function redirectTo(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = NextResponse.redirect(new URL("/", request.url), 302);

  if (!SLUG.test(slug) || !isSupabaseConfigured) return fallback;

  const supabase = createPublicClient();
  const ua = request.headers.get("user-agent") ?? "";
  const shouldCount = !isPrefetch(request) && !userAgent(request).isBot && !LINK_PREVIEW_BOTS.test(ua);

  try {
    let url: string | null = null;

    if (shouldCount) {
      const { data, error } = await supabase.rpc("register_click", { p_slug: slug, p_source: inferSource(request) });
      if (error) throw error;
      url = data;
    } else {
      // Robôs e pré-carregamentos seguem o link, mas não contam clique.
      const { data, error } = await supabase
        .from("products")
        .select("affiliate_url")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      url = data?.affiliate_url ?? null;
    }

    if (!url || !/^https:\/\/\S+$/i.test(url)) {
      // Produto não publicado (ou arquivado): leva para a página dele,
      // que mostra "não encontrado", em vez de um erro.
      return NextResponse.redirect(new URL(`/produto/${slug}`, request.url), 302);
    }
    return redirectTo(url);
  } catch (error) {
    console.error("[ir] falha ao redirecionar", slug, error);
    return fallback;
  }
}
