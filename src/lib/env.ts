// Variáveis públicas (seguras no navegador). Chaves secretas nunca
// devem ser adicionadas aqui nem usar o prefixo NEXT_PUBLIC_.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);
