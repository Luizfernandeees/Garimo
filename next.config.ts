import type { NextConfig } from "next";

// Hosts externos aceitos para imagens coladas por link (CDN da Shopee).
// Mantenha igual à lista em src/lib/image-hosts.ts. A lista fica repetida
// aqui de propósito: o next.config é carregado antes do resto do projeto e
// não deve importar arquivos de src/.
const EXTERNAL_IMAGE_HOSTS = ["down-br.img.susercontent.com", "cf.shopee.com.br"];

const supabase = (() => {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return { host: url.hostname, protocol: url.protocol.replace(":", "") as "http" | "https", port: url.port };
  } catch {
    return undefined;
  }
})();

// Só verdadeiro quando o Supabase roda na própria máquina (Supabase CLI
// local). Em produção o endereço é público e isto fica desligado.
const isLocalSupabase = supabase ? ["localhost", "127.0.0.1"].includes(supabase.host) : false;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: [
      // Imagens enviadas pelo painel para o Supabase Storage
      ...(supabase
        ? [{ protocol: supabase.protocol, hostname: supabase.host, port: supabase.port, pathname: "/storage/v1/object/public/**" }]
        : []),
      // Imagens da CDN da Shopee coladas por link no cadastro
      ...EXTERNAL_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
