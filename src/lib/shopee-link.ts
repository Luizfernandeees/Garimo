// Identifica o item da Shopee (loja.item) a partir de um link.
// Serve só para impedir cadastro repetido; o link de afiliado salvo
// nunca é alterado.

const PATTERNS = [/-i\.(\d+)\.(\d+)/, /\/product\/(\d+)\/(\d+)/, /[?&]shopid=(\d+)&itemid=(\d+)/i];

export function extractItemKey(url: string): string | null {
  let text = url;
  // Links "universal" trazem o endereço do produto codificado dentro.
  for (let i = 0; i < 3; i++) {
    for (const re of PATTERNS) {
      const m = text.match(re);
      if (m) return `${m[1]}.${m[2]}`;
    }
    try {
      const decoded = decodeURIComponent(text);
      if (decoded === text) break;
      text = decoded;
    } catch {
      break;
    }
  }
  return null;
}

const SHORT_HOSTS = /^(s\.shopee\.com\.br|shp\.ee)$/i;

// Para links curtos (s.shopee.com.br/…, shp.ee/…), consulta só o endereço
// de redirecionamento, sem abrir nem ler a página do produto. É uma
// tentativa: se a Shopee não responder em 3 s, segue sem a identificação
// e a proteção fica por conta do link exato e dos nomes parecidos.
export async function resolveItemKey(url: string): Promise<string | null> {
  const direct = extractItemKey(url);
  if (direct) return direct;

  let current = url;
  for (let hop = 0; hop < 3; hop++) {
    let host: string;
    try {
      host = new URL(current).hostname;
    } catch {
      return null;
    }
    if (hop === 0 && !SHORT_HOSTS.test(host)) return null;
    try {
      const res = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(3000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; GARIMO link check)" },
      });
      const location = res.headers.get("location");
      if (!location) return null;
      current = new URL(location, current).toString();
      const key = extractItemKey(current);
      if (key) return key;
    } catch {
      return null;
    }
  }
  return null;
}
