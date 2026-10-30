"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

// Usado só no painel, para enviar imagens direto ao Storage com a sessão
// do admin (o RLS do bucket confere se é admin).
let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getBrowserClient() {
  client ??= createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
  return client;
}
