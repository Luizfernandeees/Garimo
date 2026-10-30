import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

// Cliente para o site público: sem sessão e sem cookies, para que as
// páginas possam ser cacheadas. Enxerga apenas o que o RLS libera para
// visitantes (produtos publicados, categorias e configurações).
export function createPublicClient() {
  return createSupabaseClient<Database>(env.supabaseUrl || "http://localhost", env.supabaseKey || "missing", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
