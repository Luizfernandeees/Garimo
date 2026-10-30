import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: "proxy" substitui o antigo "middleware".
// Roda só nas rotas do painel; o site público não lê cookies.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
